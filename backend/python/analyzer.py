import os
import json
import base64
import fitz  # PyMuPDF
import sys
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # Increase to 50MB for large PDFs/Documents

# Telegram Production Configuration
TG_DC_IP = "149.154.167.50"
TG_DC_PORT = 443
TG_RSA_KEY = """-----BEGIN RSA PUBLIC KEY-----
MIIBCgKCAQEA6LszBcC1LGzyr992NzE0ieY+BSaOW622Aa9Bd4ZHLl+TuFQ4lo4g
5nKaMBwK/BIb9xUfg0Q29/2mgIR6Zr9krM7HjuIcCzFvDtr+L0GQjae9H0pRB2OO
62cECs5HKhT5DZ98K33vmWiLowc621dQuwKWSQKjWf50XYFw42h21P2KXUGyp2y/
+aEyZ+uVgLLQbRA1dEjSDZ2iGRy12Mk5gpYc397aYp438fsJoHIgJ2lgMv5h7WY9
t6N/byY9Nw9p21Og3AoXSL2q/2IJ1WRUhebgAdGVMlV1fkuOQoEzR7EdpqtQD9Cs
5+bfo3Nhmcyvk5ftB0WkJ9z6bNZ7yxrP8wIDAQAB
-----END RSA PUBLIC KEY-----"""

# Helper to configure keys from request
def configure_api_keys(request_data):
    # Get keys from request if present
    req_keys = request_data.get('keys', {})
    
    # Prioritize Request Key -> Env Key
    gemini_key = req_keys.get('gemini') or os.getenv("VITE_GEMINI_API_KEY") or os.getenv("VITE_GOOGLE_API_KEY")
    openai_key = req_keys.get('openai') or os.getenv("VITE_OPENAI_API_KEY")
    
    if gemini_key:
        try:
            genai.configure(api_key=gemini_key)
            print(f"DEBUG: Configured Gemini with {'key from request' if req_keys.get('gemini') else 'env key'}")
        except Exception as e:
            print(f"DEBUG: Error configuring Gemini: {e}")
    
    return gemini_key, openai_key

GEMINI_API_KEY = os.getenv("VITE_GEMINI_API_KEY") or os.getenv("VITE_GOOGLE_API_KEY")
OPENAI_API_KEY = os.getenv("VITE_OPENAI_API_KEY")

SYSTEM_PROMPT = """
You are an intelligent academic assistant. Your goal is to understand the context of the document.
1. CLASSIFY: Is this a "Schedule/Calendar", "Assignment Brief", "Module Guide", or "Study Material"?
2. IDENTIFY: Detect any module codes (e.g., 'MIP1501', 'HSY2601'). If none are explicit, infer the subject.
3. EXTRACT: 
   - Find ALL tasks, assessments, and deadlines.
   - Find ALL prescribed books, textbooks, and required reading materials.
   - For books, try to find Title, Author, and Edition.
4. OUTPUT: valid JSON only.
"""

JSON_STRUCTURE_PROMPT = """
Analyze this file and extract the data based on your understanding.
Return ONLY raw JSON.

Structure:
{
  "type": "module" | "assignment" | "material",
  "data": { 
    "code": "Dominant Module Code",
    "normalized_code": "Standardized Code",
    "title": "A descriptive title", 
    "institution": "University Name",
    "description": "Summary",
    "module_codes_found": [],
    "assignments_found": [
        { 
            "code": "Module Code", 
            "normalized_code": "Standardized Code",
            "title": "Task Title", 
            "due_date": "YYYY-MM-DD", 
            "description": "Details"
        }
    ],
    "prescribed_books": [
        {
            "title": "Book Title",
            "author": "Author Name",
            "edition": "Edition details"
        }
    ]
  }
}
"""

def extract_text_from_pdf(base64_pdf):
    try:
        print(f"DEBUG: Decoding PDF base64, length: {len(base64_pdf)}")
        sys.stdout.flush()
        
        # Clean base64 if it has prefix (sanity check)
        if "," in base64_pdf:
            base64_pdf = base64_pdf.split(",")[1]
            
        pdf_data = base64.b64decode(base64_pdf)
        print(f"DEBUG: PDF binary size: {len(pdf_data)}")
        sys.stdout.flush()
        
        if len(pdf_data) == 0:
            print("DEBUG: PDF data is empty after decoding")
            return ""
            
        doc = fitz.open(stream=pdf_data, filetype="pdf")
        print(f"DEBUG: PDF opened successfully, page count: {len(doc)}")
        sys.stdout.flush()
        
        text = ""
        for page in doc:
            text += page.get_text()
        
        print(f"DEBUG: Extracted text length: {len(text)}")
        sys.stdout.flush()
        return text
    except Exception as e:
        print(f"DEBUG: Error extracting PDF: {e}")
        sys.stdout.flush()
        return ""

AVAILABLE_MODELS = []

def get_available_models(api_key=None):
    global AVAILABLE_MODELS
    
    current_key = api_key or GEMINI_API_KEY
    if not current_key:
        print("DEBUG: No Gemini API key provided for model listing")
        return ['models/gemini-1.5-flash', 'models/gemini-2.0-flash']
        
    try:
        genai.configure(api_key=current_key)
        models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                models.append(m.name)
        
        # Sort so that flash models come first, then older versions
        priority_models = []
        
        # 1. Look for Flash 2.0 (Fastest/Newest)
        priority_models.extend([m for m in models if '2.0' in m and 'flash' in m])
        # 2. Look for Flash 1.5 (Standard Stable)
        priority_models.extend([m for m in models if '1.5' in m and 'flash' in m])
        # 3. Look for Any other Flash
        priority_models.extend([m for m in models if 'flash' in m and m not in priority_models])
        # 4. Look for Pro models
        priority_models.extend([m for m in models if 'pro' in m and m not in priority_models])
        
        # Finally add everything else
        for m in models:
            if m not in priority_models:
                priority_models.append(m)
        
        # Clean up duplicates
        result = []
        for p in priority_models:
            if p not in result:
                result.append(p)

        print(f"DEBUG: Discovered Model Priority: {result}")
        sys.stdout.flush()
        return result
    except Exception as e:
        print(f"DEBUG: Failed to list models: {e}")
        sys.stdout.flush()
        return ['models/gemini-2.0-flash', 'models/gemini-1.5-flash']

def call_openai(prompt, system_prompt=SYSTEM_PROMPT, api_key=None):
    current_key = api_key or OPENAI_API_KEY
    if not current_key:
        return None, "OpenAI API key not configured"
        
    try:
        client = OpenAI(api_key=current_key)
        
        print("DEBUG: Trying OpenAI model: gpt-4o")
        sys.stdout.flush()
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            timeout=60
        )
        
        if response.choices and len(response.choices) > 0:
            return response.choices[0].message.content, None
        else:
            return None, "OpenAI returns empty response"
            
    except Exception as e:
        print(f"DEBUG: OpenAI failed: {e}")
        sys.stdout.flush()
        # Fallback to 3.5 Turbo or 4o-mini
        try:
            print("DEBUG: Trying OpenAI fallback model: gpt-4o-mini")
            sys.stdout.flush()
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                timeout=60
            )
            return response.choices[0].message.content, None
        except Exception as e2:
            print(f"DEBUG: OpenAI fallback failed: {e2}")
            sys.stdout.flush()
            return None, f"OpenAI failed: {e}"

def call_gemini(prompt, system_prompt=SYSTEM_PROMPT, image_data=None, mime_type=None, api_key=None):
    current_key = api_key or GEMINI_API_KEY
    if not current_key:
        return None, "Gemini API key not configured"
    
    try:
        genai.configure(api_key=current_key)
        models_to_try = get_available_models(current_key)
        
        print(f"DEBUG: Prompt length: {len(prompt)}")
        sys.stdout.flush()
        
        # Add explicit JSON instruction if the prompt seems to want structured data
        enhanced_prompt = prompt
        if any(keyword in prompt.lower() for keyword in ['json', 'structure', 'format', 'schema', 'array', 'object']):
            enhanced_prompt = f"{prompt}\n\nIMPORTANT: Return ONLY valid JSON. Do not include markdown code blocks, explanations, or any text before/after the JSON. Start with {{ or [ and end with }} or ]."
        
        last_err_msg = None
        for model_id in models_to_try:
            try:
                print(f"DEBUG: Trying Gemini model: {model_id}")
                sys.stdout.flush()
                model = genai.GenerativeModel(model_id)
                
                # Add request_options for timeout
                if image_data and mime_type:
                    response = model.generate_content(
                        [enhanced_prompt, {"mime_type": mime_type, "data": image_data}],
                        request_options={'timeout': 90} # Increased timeout for large PDFs
                    )
                else:
                    full_prompt = f"{system_prompt}\n\n{enhanced_prompt}" if system_prompt else enhanced_prompt
                    response = model.generate_content(
                        full_prompt,
                        request_options={'timeout': 90}
                    )
                
                if hasattr(response, 'candidates') and response.candidates:
                    return response.text, None
                else:
                    # Handle empty response (Safety filter or other block)
                    return None, "AI blocked response or returned empty result."
            except Exception as e:
                print(f"DEBUG: Gemini {model_id} failed: {e}")
                sys.stdout.flush()
                # If we get an internal error from Google, it often has "UnknownError" in it
                last_err_msg = str(e)
                continue
        
        last_msg = last_err_msg if last_err_msg else "All Gemini models failed"
        return None, last_msg
    except Exception as e:
        print(f"DEBUG: call_gemini outer exception: {e}")
        sys.stdout.flush()
        return None, str(e)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy"})

def extract_json(text):
    if not text:
        return None
    
    # 1. Basic cleaning
    cleaned = text.replace('```json', '').replace('```', '').strip()
    
    try:
        # Simple attempt
        return json.loads(cleaned)
    except Exception:
        # 2. Find structural boundaries
        first_brace = cleaned.find('{')
        first_bracket = cleaned.find('[')
        
        start_idx = -1
        if first_brace != -1 and (first_bracket == -1 or first_brace < first_bracket):
            start_idx = first_brace
        elif first_bracket != -1:
            start_idx = first_bracket
            
        if start_idx == -1:
            # If no braces found, maybe it's raw text? We'll let the caller handle it or raise
            raise ValueError("No JSON structure ({ or [) found in response")
            
        # Find the last matching closing brace/bracket
        is_object = cleaned[start_idx] == '{'
        closer = '}' if is_object else ']'
        end_idx = cleaned.rfind(closer)
        
        if end_idx == -1 or end_idx <= start_idx:
            raise ValueError(f"Malformed JSON: Found starter {cleaned[start_idx]} but no closing {closer}")
            
        candidate = cleaned[start_idx:end_idx + 1]
        
        try:
            return json.loads(candidate)
        except Exception as inner_e:
            # 3. Last ditch: try to fix common AI JSON errors using regex
            import re
            try:
                # Fix trailing commas: [1, 2, ] -> [1, 2]
                fixed = re.sub(r',\s*([\}\]])', r'\1', candidate)
                # Fix unquoted or single quoted keys: {key: "val"} or {'key': "val"} -> {"key": "val"}
                fixed = re.sub(r"([{,]\s*)['\"]?([a-zA-Z0-9_]+)['\"]?\s*:", r'\1"\2":', fixed)
                # Fix single quoted string values: : 'val' -> : "val"
                fixed = re.sub(r':\s*\'([^\']*)\'', r': "\1"', fixed)
                return json.loads(fixed)
            except Exception:
                raise inner_e # Return original error if regex fix fails

@app.route('/classify', methods=['POST'])
def classify():
    data = request.json
    file_base64 = data.get('fileBase64')
    mime_type = data.get('mimeType')
    
    gemini_key, _ = configure_api_keys(data)
    
    if not file_base64 or not mime_type:
        return jsonify({"error": "Missing data"}), 400

    content = ""
    # Try text extraction first
    if "pdf" in mime_type:
        content = extract_text_from_pdf(file_base64)
    elif "text" in mime_type or "javascript" in mime_type or "json" in mime_type:
        try:
            content = base64.b64decode(file_base64).decode('utf-8')
        except:
            try:
                content = base64.b64decode(file_base64).decode('latin-1')
            except:
                content = ""

    image_data = None
    # Clean base64 for decoding
    clean_b64 = file_base64.split(",")[1] if "," in file_base64 else file_base64
    
    # Logic for sending binary to Gemini:
    # Always send images, small PDFs, and office docs for best accuracy.
    is_binary_format = any(t in mime_type for t in ["image", "pdf", "officedocument", "msword", "excel", "powerpoint"])
    
    if is_binary_format and len(clean_b64) < 20 * 1024 * 1024:
        try:
            image_data = base64.b64decode(clean_b64)
            print(f"DEBUG: Successfully decoded binary ({len(image_data)} bytes)")
        except Exception as e:
            print(f"DEBUG: Failed to decode binary for Gemini: {e}")
    
    # Final prompt construction
    prompt = f"{SYSTEM_PROMPT}\n{JSON_STRUCTURE_PROMPT}"
    if content:
        prompt += f"\n\nDocument Content (Extracted Text):\n{content[:25000]}"
    
    # Gemini MIME Type Mapping
    gemini_mime = mime_type
    print(f"DEBUG: Incoming MIME type: {mime_type}")
    
    if "officedocument.wordprocessingml.document" in mime_type: gemini_mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    elif "officedocument.spreadsheetml.sheet" in mime_type: gemini_mime = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    elif "officedocument.presentationml.presentation" in mime_type: gemini_mime = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    elif "pdf" in mime_type: gemini_mime = "application/pdf"
    elif not content and "text" in mime_type: gemini_mime = "text/plain"
    
    print(f"DEBUG: Calling Gemini with image_data? {'Yes' if image_data else 'No'}, Mime: {gemini_mime}")
    sys.stdout.flush()
    
    res_text, err = call_gemini(prompt, image_data=image_data, mime_type=gemini_mime, api_key=gemini_key)
    
    if res_text:
        try:
            parsed = extract_json(res_text)
            # Ensure basic structure if AI missed it
            if "data" not in parsed:
                parsed = {"type": "material", "data": parsed}
            return jsonify(parsed)
        except Exception as e:
            print(f"DEBUG: classify JSON parse error: {e}")
            return jsonify({
                "error": "Failed to parse AI response into JSON", 
                "details": str(e),
                "type": "material", 
                "data": {"title": "Error Processing Document", "description": res_text[:500]}
            }), 200 # Return 200 so frontend can at least show the raw text in description
    
    return jsonify({"error": err or "Gemini failed to process this file type."}), 500

@app.route('/generate', methods=['POST'])
def generate():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        prompt = data.get('prompt')
        system_prompt = data.get('systemPrompt', SYSTEM_PROMPT)
        
        print(f"DEBUG: Generating text for prompt: {prompt[:50]}...")
        sys.stdout.flush()
        
        gemini_key, openai_key = configure_api_keys(data)
        
        if not prompt:
            return jsonify({"error": "Missing prompt"}), 400

        # Try Gemini first
        res_text, err = call_gemini(prompt, system_prompt=system_prompt, api_key=gemini_key)
        
        if res_text is not None:
            return jsonify({"text": res_text})
        
        print(f"DEBUG: Gemini failed, attempting OpenAI fallback: {err}")
        sys.stdout.flush()
        
        # Try OpenAI fallback
        res_text, err_oa = call_openai(prompt, system_prompt=system_prompt, api_key=openai_key)
        
        if res_text is not None:
            return jsonify({"text": res_text})
            
        print(f"DEBUG: Both Gemini and OpenAI failed.")
        sys.stdout.flush()
        return jsonify({
            "error": "All AI models failed",
            "details": {
                "gemini": err,
                "openai": err_oa
            }
        }), 500
    except Exception as e:
        print(f"DEBUG: Exception in generate: {e}")
        sys.stdout.flush()
        return handle_exception(e)

@app.errorhandler(Exception)
def handle_exception(e):
    # Pass through HTTP errors
    # if isinstance(e, HTTPException): return e
    
    print(f"GLOBAL ERROR: {e}")
    sys.stdout.flush()
    return jsonify({
        "error": "Internal Server Error",
        "details": str(e)
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"PYTHON BACKEND STARTING ON PORT {port}...")
    sys.stdout.flush()
    app.run(host='0.0.0.0', port=port, debug=False)
