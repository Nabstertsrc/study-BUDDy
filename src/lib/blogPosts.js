/**
 * blogPosts.js — Educational blog content for Study Buddy
 * Each post explains a core feature in depth to meet AdSense content requirements.
 * Content is original, educational, and ~600-900 words per post.
 */

export const blogPosts = [
  {
    slug: "how-to-use-ai-study-lab",
    title: "How to Use the AI Study Lab: OCR, Quizzes & Smart Summaries",
    date: "2026-09-01",
    readTime: "6 min read",
    category: "Feature Guide",
    categoryColor: "blue",
    excerpt:
      "The AI Study Lab is the heart of Study Buddy. Learn how to upload your notes, extract text from images using OCR, generate interactive quizzes, and get AI-powered summaries that actually make sense.",
    featureSection: {
      label: "Study Lab",
      description: "Upload materials → AI processes → instant quizzes & summaries",
      steps: [
        { icon: "📄", label: "Upload PDF, image, or paste text" },
        { icon: "🔍", label: "AI reads & extracts key concepts (OCR)" },
        { icon: "🧠", label: "Generate quiz, summary, or deep-dive" },
        { icon: "✅", label: "Test yourself and track your score" },
      ],
    },
    content: [
      {
        type: "intro",
        text: "Whether you are staring at a 40-page chapter at midnight or trying to turn your hand-written class notes into something you can actually study from, the Study Buddy AI Study Lab is designed to do the heavy lifting for you. This guide walks you through every feature available in the Lab, with tips on how to get the best results.",
      },
      {
        type: "h2",
        text: "What Is the Study Lab?",
      },
      {
        type: "p",
        text: "The Study Lab is Study Buddy's primary AI workspace. It is where you bring your raw study materials — whether that is a scanned textbook page, a class handout, a PDF, or even a photo of your whiteboard — and transform them into interactive learning experiences. The Lab combines Optical Character Recognition (OCR) with large-language-model AI to understand not just the words, but the concepts behind your content.",
      },
      {
        type: "h2",
        text: "Step 1: Uploading Your Materials",
      },
      {
        type: "p",
        text: "To get started, open the Study Lab from the navigation menu. You will see a clean upload area at the top of the screen. You can drag and drop a PDF or image directly onto this area, or click the upload button to browse your device. Study Buddy accepts PDFs, JPEGs, PNGs, and plain text. If you have notes you typed up in another app, you can also paste them directly into the text input field.",
      },
      {
        type: "tip",
        text: "For best OCR results on handwritten notes, use good lighting and make sure your handwriting is legible. Printed text from textbooks or typed notes will be processed almost perfectly.",
      },
      {
        type: "h2",
        text: "Step 2: Understanding OCR — How the AI Reads Your Materials",
      },
      {
        type: "p",
        text: "OCR stands for Optical Character Recognition. When you upload an image or a scanned PDF, Study Buddy uses OCR technology to read the text in the image just like a human would. This is especially useful for students who have physical textbooks, printed worksheets, or handwritten notes. Instead of manually re-typing everything, you simply take a photo and the AI extracts all the text automatically. The extracted text is then passed to the AI for further analysis.",
      },
      {
        type: "p",
        text: "The OCR engine in Study Buddy is designed to handle multiple languages and a variety of fonts. It can even handle tables, equations (though complex LaTeX may vary), and bullet-point structures. After extraction, you will see the recognized text displayed so you can verify it before asking the AI to process it further.",
      },
      {
        type: "h2",
        text: "Step 3: Generating Quizzes",
      },
      {
        type: "p",
        text: "Once your material is uploaded and processed, the most powerful feature becomes available: AI-generated quizzes. Click the 'Generate Quiz' button and Study Buddy will analyze your content and create a set of multiple-choice or short-answer questions designed to test your understanding of the key concepts. These are not random trivia questions — the AI specifically targets the main ideas, definitions, dates, formulas, or processes described in your material.",
      },
      {
        type: "p",
        text: "You can then take the quiz right inside the app. Each question shows your answer and the correct answer, with a brief explanation of why. Your scores are tracked over time so you can see if you are improving. Research in educational psychology consistently shows that active recall through quizzing is one of the most effective ways to lock in long-term memory — which is exactly why this feature exists in Study Buddy.",
      },
      {
        type: "h2",
        text: "Step 4: Smart Summaries",
      },
      {
        type: "p",
        text: "Not sure where to start on a long chapter? Use the 'Summarize' feature. Study Buddy will read through your entire uploaded document and produce a concise summary that captures the main points, key vocabulary, and essential take-aways. You can choose between a brief overview (3–5 bullet points) or a detailed paragraph-format summary.",
      },
      {
        type: "p",
        text: "The summary is especially useful for revision purposes. Instead of re-reading 30 pages before an exam, you can review a one-page AI summary and then test yourself with the quiz. This two-step approach — summary followed by quiz — is a proven study technique called spaced retrieval practice.",
      },
      {
        type: "h2",
        text: "Tips for Getting the Best Results",
      },
      {
        type: "list",
        items: [
          "Keep uploads focused: upload one chapter or one topic at a time rather than an entire textbook. Smaller chunks give the AI more room to go deep rather than wide.",
          "Use the quiz first, then re-read: many students find it helpful to attempt a quiz before fully studying — this activates prior knowledge and makes the subsequent reading stick better.",
          "Save your summaries: use the copy or save buttons to keep your summaries outside the app as quick-reference sheets.",
          "Mix media: try uploading both your own notes AND the relevant textbook section and generating a combined summary to fill in the gaps.",
        ],
      },
      {
        type: "h2",
        text: "The Ad-Supported Model",
      },
      {
        type: "p",
        text: "Advanced AI generation features — like detailed deep-dives and comprehensive assessments — are completely free in Study Buddy. To access them, you may be shown a short advertisement before the AI processes your request. This keeps the product free for every student regardless of budget. The ad system is powered by Google AdMob, and ads are always age-appropriate and education-related where possible.",
      },
      {
        type: "conclusion",
        text: "The AI Study Lab is your all-in-one homework processing center. From raw scanned notes to a fully interactive quiz session, it removes the friction between having materials and actually learning from them. Give it a try tonight — upload your next assignment and let Study Buddy do the reading first.",
      },
    ],
    relatedSlugs: ["tracking-progress-on-your-dashboard", "building-a-personalized-learning-path"],
  },

  {
    slug: "organizing-studies-with-auto-organizer",
    title: "Organizing Your Studies with the AI Auto-Organizer",
    date: "2026-09-03",
    readTime: "5 min read",
    category: "Feature Guide",
    categoryColor: "purple",
    excerpt:
      "The Auto-Organizer uses AI to automatically categorize and group your study materials, assignments, and notes — saving you hours of admin work every semester.",
    featureSection: {
      label: "Auto-Organizer",
      description: "Drop your files → AI sorts, tags, and groups them by subject",
      steps: [
        { icon: "📂", label: "Upload or connect your study materials" },
        { icon: "🤖", label: "AI detects topics, subjects & categories" },
        { icon: "🗂️", label: "Materials auto-grouped into organized folders" },
        { icon: "🔎", label: "Smart search across all your content" },
      ],
    },
    content: [
      {
        type: "intro",
        text: "Most students are drowning in files — PDFs scattered across folders, assignment PDFs mixed in with lecture notes, multiple subjects blending into one chaotic download directory. The Auto-Organizer is Study Buddy's answer to this problem: an AI that reads, understands, and categorizes your study materials automatically.",
      },
      {
        type: "h2",
        text: "What Problem Does the Auto-Organizer Solve?",
      },
      {
        type: "p",
        text: "Organization is one of the biggest hidden time costs of being a student. Studies in academic productivity show that students spend an average of 15-20 minutes per study session just finding the right material before they can start studying. Multiply that by every session across a semester and you lose a significant amount of actual study time to pure logistics. The Auto-Organizer eliminates this overhead.",
      },
      {
        type: "h2",
        text: "How the AI Organizer Works",
      },
      {
        type: "p",
        text: "When you upload materials to the Auto-Organizer, the AI reads the content of each document — not just the filename. It identifies the subject area, the topic, the document type (notes, assignment, textbook chapter, past paper), and the approximate difficulty level. It then groups related materials together automatically and suggests tags you can use to search across your content later.",
      },
      {
        type: "p",
        text: "For example: if you upload three PDFs — one about the French Revolution, one about the Industrial Revolution, and one World History past paper — the AI will group the first two under History > Modern Europe and flag the third as a Practice Paper for the same category. All of this happens in seconds without you having to drag a single file.",
      },
      {
        type: "h2",
        text: "Connecting Your Modules",
      },
      {
        type: "p",
        text: "The Auto-Organizer integrates directly with your Modules (or Subjects) in Study Buddy. Once you have set up your modules in the Modules page, the organizer automatically routes new materials into the correct module folder. You can also manually move materials between modules if the AI's categorization needs a correction — and Study Buddy learns from these corrections over time.",
      },
      {
        type: "h2",
        text: "Smart Search Across All Your Content",
      },
      {
        type: "p",
        text: "Once your materials are organized, the built-in search lets you query across everything. Search for 'mitosis' and you will see every note, PDF, and summary that mentions it — regardless of which module it lives in. This cross-module search is particularly valuable during exam season when you need to pull together information from multiple subjects quickly.",
      },
      {
        type: "tip",
        text: "Add your upcoming exam dates to the Assignments page first — the Auto-Organizer will use this context to flag which materials are most time-sensitive and surface them at the top of your study queue.",
      },
      {
        type: "h2",
        text: "Using the Organizer for Exam Preparation",
      },
      {
        type: "p",
        text: "The Auto-Organizer has a built-in exam prep mode. When you mark an assignment or test as upcoming in the Assignments page, the organizer surfaces all related materials from your library and creates a suggested study sequence based on the exam date and the complexity of each topic. This means your study schedule is not just a to-do list — it is an AI-recommended learning path built specifically from your own materials.",
      },
      {
        type: "conclusion",
        text: "Stop spending your precious study time organizing your study time. Let the Auto-Organizer handle the file management so you can focus entirely on learning. Upload your semester's materials in one go and watch your entire study library organize itself.",
      },
    ],
    relatedSlugs: ["how-to-use-ai-study-lab", "tracking-progress-on-your-dashboard"],
  },

  {
    slug: "tracking-progress-on-your-dashboard",
    title: "Tracking Your Learning Progress on the Dashboard",
    date: "2026-09-05",
    readTime: "5 min read",
    category: "Feature Guide",
    categoryColor: "indigo",
    excerpt:
      "The Study Buddy Dashboard gives you a real-time overview of your academic progress — modules, assignments, quiz scores, study streaks, and AI-powered insights all in one place.",
    featureSection: {
      label: "Dashboard",
      description: "Your live academic snapshot — stats, deadlines, and AI insights",
      steps: [
        { icon: "📊", label: "View enrolled modules & pending assignments" },
        { icon: "🏆", label: "Track quiz scores & study hours" },
        { icon: "🔥", label: "Maintain your study streak" },
        { icon: "💡", label: "Get AI-powered study recommendations" },
      ],
    },
    content: [
      {
        type: "intro",
        text: "The Dashboard is the first thing you see when you log in to Study Buddy, and there is a good reason for that. It is designed to give you a complete picture of your academic situation in under 10 seconds — what needs attention, what you have been doing well at, and what the AI thinks you should focus on next.",
      },
      {
        type: "h2",
        text: "The Four Key Stats",
      },
      {
        type: "p",
        text: "At the top of the Dashboard you will find four summary cards that track the most important numbers in your academic life. The first shows how many modules or subjects you are currently enrolled in. The second shows the number of pending assignments with upcoming due dates. The third tracks how many quizzes you have completed along with your average score. The fourth shows your total study hours logged this semester.",
      },
      {
        type: "p",
        text: "These four numbers are not just vanity metrics — they are your academic health indicators. A growing number of completed quizzes combined with an improving average score tells you that your study sessions are working. A high number of pending assignments relative to your study hours might be a signal that you need to shift your focus from passive reading to active task completion.",
      },
      {
        type: "h2",
        text: "Upcoming Deadlines",
      },
      {
        type: "p",
        text: "Below the stats cards, the Dashboard shows your upcoming assignment deadlines sorted by date. Each deadline displays the assignment name, the module it belongs to, and how many days remain. Color coding makes it instantly clear which assignments are urgent (red), coming up soon (amber), or comfortably scheduled (green). Clicking any deadline takes you directly to the full Assignments page for that item.",
      },
      {
        type: "h2",
        text: "AI Study Tools Carousel",
      },
      {
        type: "p",
        text: "The middle section of the Dashboard features the AI Study Tools carousel — a horizontal swipeable row of quick-access shortcuts to your most used AI features. From here you can jump directly into generating a quiz, creating a summary, starting a study session, or accessing the Study Lab without navigating through menus. Think of it as a launchpad for your study session.",
      },
      {
        type: "h2",
        text: "Module Progress Tracker",
      },
      {
        type: "p",
        text: "Each module you have enrolled in shows a progress bar indicating how far through the curriculum you have tracked progress. This is not automatically measured — you update it manually as you complete topics, which is actually an intentional design choice. The act of updating your progress is itself a form of reflection: it forces you to honestly assess what you know versus what you have just been exposed to.",
      },
      {
        type: "h2",
        text: "Study Streak",
      },
      {
        type: "p",
        text: "Consistency is one of the most reliable predictors of academic success, which is why the Dashboard shows your current study streak — the number of consecutive days you have logged at least one study session. Streaks are psychologically powerful motivators. Research in behavioral science shows that humans have a strong aversion to breaking streaks once established. Use this to your advantage: even a short 15-minute session on busy days keeps your streak alive and maintains your learning momentum.",
      },
      {
        type: "h2",
        text: "AI Insights Panel",
      },
      {
        type: "p",
        text: "The AI Insights panel in the bottom-right corner of the Dashboard is where Study Buddy's intelligence really shows. Based on your quiz scores, assignment due dates, and study session history, the AI generates personalized recommendations. It might notice that you have three quizzes below 60% in Chemistry and suggest you revisit the Study Lab for those topics, or it might flag an assignment deadline that is approaching faster than your current study pace can handle.",
      },
      {
        type: "tip",
        text: "Check the Dashboard first every time you sit down to study. It takes less than 30 seconds to read and will orient your entire session around what matters most right now.",
      },
      {
        type: "conclusion",
        text: "The Dashboard is not just a pretty overview — it is a decision-making tool. Use it to make smarter choices about where to spend your study time every single day, and let the AI surface the insights you might miss when you are deep in your notes.",
      },
    ],
    relatedSlugs: ["creating-and-managing-assignments", "how-to-use-ai-study-lab"],
  },

  {
    slug: "creating-and-managing-assignments",
    title: "Creating and Managing Assignments in Study Buddy",
    date: "2026-09-07",
    readTime: "5 min read",
    category: "Feature Guide",
    categoryColor: "amber",
    excerpt:
      "Never miss a deadline again. Learn how to add, track, filter, and submit assignments in Study Buddy — with smart deadline warnings and AI-powered task prioritization.",
    featureSection: {
      label: "Assignments",
      description: "Full assignment lifecycle — create, track, prioritize & submit",
      steps: [
        { icon: "➕", label: "Add assignment with title, module & due date" },
        { icon: "📅", label: "Smart calendar view with color-coded urgency" },
        { icon: "⚡", label: "AI suggests which tasks to tackle first" },
        { icon: "✅", label: "Mark complete and track submission history" },
      ],
    },
    content: [
      {
        type: "intro",
        text: "Missing a deadline or forgetting an assignment is one of the most stressful experiences in a student's life. Study Buddy's Assignments page is built to make sure that never happens. It is a full assignment management system with deadline tracking, status updates, AI prioritization, and integration with the rest of the app.",
      },
      {
        type: "h2",
        text: "Adding a New Assignment",
      },
      {
        type: "p",
        text: "To add a new assignment, navigate to the Assignments page and click the '+' button. Fill in the assignment title, select the module it belongs to, set the due date, and optionally add a description or attachment. You can also set the assignment type (essay, quiz, project, lab report, etc.) which helps Study Buddy categorize and display it appropriately.",
      },
      {
        type: "p",
        text: "Once added, the assignment immediately appears in your list sorted by due date. It also shows up in the Dashboard's upcoming deadlines panel so you always have visibility into what is coming without having to navigate away from your main hub.",
      },
      {
        type: "h2",
        text: "Understanding Assignment Status",
      },
      {
        type: "p",
        text: "Each assignment has a status that moves through a simple lifecycle: Not Started → In Progress → Submitted → Graded. You update this status manually as you work through the task. The status affects how the assignment appears in your list and Dashboard — submitted and graded assignments are moved to a separate history section so your active list stays clean and focused on what needs your attention.",
      },
      {
        type: "h2",
        text: "Color-Coded Urgency System",
      },
      {
        type: "p",
        text: "Study Buddy automatically calculates how urgent each assignment is based on its due date and your current workload. Assignments due within 24 hours appear in red with a warning. Assignments due within 3 days appear in amber. Everything else is shown in the standard view. This visual system means you can glance at the Assignments page and instantly know where to focus — no mental math required.",
      },
      {
        type: "h2",
        text: "Filtering and Sorting",
      },
      {
        type: "p",
        text: "During exam season you might have dozens of assignments tracked simultaneously. The filter bar at the top of the Assignments page lets you narrow your view by module, by status, by type, or by due date range. You can also sort by urgency, alphabetically, or by module. This makes it easy to focus on one subject at a time or see everything that is due this week across all your modules.",
      },
      {
        type: "tip",
        text: "At the start of each semester, spend 20 minutes entering all your assignments and tests from your course syllabi. Having everything in the system from day one means you will never be surprised by a deadline you forgot to track.",
      },
      {
        type: "h2",
        text: "AI Task Prioritization",
      },
      {
        type: "p",
        text: "One of the more powerful hidden features of the Assignments page is AI prioritization. When you have multiple assignments approaching at the same time, the AI considers not just the due dates but also the complexity of each task (based on the type and any notes you have added) and your study history for the relevant modules. It then surfaces a recommended order for tackling your workload to minimize last-minute stress.",
      },
      {
        type: "h2",
        text: "Notifications and Reminders",
      },
      {
        type: "p",
        text: "Study Buddy sends you push notifications as deadlines approach — 3 days before, 24 hours before, and a final reminder on the day of the due date. You can customize notification timing in the Settings page. The notification bell in the top navigation bar also shows you a live count of upcoming deadlines so you are always informed even when you are using other features of the app.",
      },
      {
        type: "conclusion",
        text: "The Assignments page is your contract with your future self. Every assignment you enter is a commitment tracked by the app so that your brain does not have to hold it. Use it consistently and you will find that deadline anxiety becomes a thing of the past.",
      },
    ],
    relatedSlugs: ["tracking-progress-on-your-dashboard", "building-a-personalized-learning-path"],
  },

  {
    slug: "building-a-personalized-learning-path",
    title: "Building a Personalized Learning Path with Study Buddy",
    date: "2026-09-09",
    readTime: "6 min read",
    category: "Feature Guide",
    categoryColor: "emerald",
    excerpt:
      "The Learning Path feature generates a step-by-step curriculum tailored to your goals, current knowledge level, and available study time — so you always know exactly what to study next.",
    featureSection: {
      label: "Learning Path",
      description: "AI maps your curriculum from where you are to where you need to be",
      steps: [
        { icon: "🎯", label: "Set your learning goal or select a topic" },
        { icon: "📋", label: "AI assesses your current knowledge level" },
        { icon: "🗺️", label: "Generates a step-by-step study roadmap" },
        { icon: "📈", label: "Progress tracked as you complete each step" },
      ],
    },
    content: [
      {
        type: "intro",
        text: "Knowing what to study is often harder than doing the studying itself. Faced with a textbook and an exam six weeks away, most students either start at page one and hope for the best, or they focus only on what they already know — which is exactly the wrong strategy. The Learning Path feature in Study Buddy solves this by generating a personalized, structured roadmap from your current knowledge to your exam-ready goals.",
      },
      {
        type: "h2",
        text: "What Is a Learning Path?",
      },
      {
        type: "p",
        text: "A Learning Path is an ordered sequence of topics or skills that builds toward a defined learning goal. Think of it like a GPS route for your brain: you tell the AI where you want to end up (e.g., 'understand integration by parts for my Calculus exam') and it maps out the stops you need to hit along the way (e.g., basic integration → integration rules → substitution → integration by parts).",
      },
      {
        type: "p",
        text: "Unlike a generic textbook chapter order, your Learning Path is personalized. The AI takes into account which topics you have already covered in the Study Lab, your quiz scores for different subject areas, and any notes you have added about concepts you find difficult. The result is a path that skips what you already know and focuses more time on what you need to master.",
      },
      {
        type: "h2",
        text: "Creating Your First Learning Path",
      },
      {
        type: "p",
        text: "Navigate to the Learning Path page from the navigation menu. Click 'Create New Path' and you will be prompted to enter your goal. This can be as specific ('Master the themes of Shakespeare's Macbeth for English Literature') or as broad ('Get ready for my end-of-year Physics exam') as you like. The more specific your goal, the more targeted your path will be.",
      },
      {
        type: "p",
        text: "After entering your goal, the AI may ask a few quick questions about your timeline and current comfort level with the subject. These take about 30 seconds to answer and dramatically improve the quality of the path it generates. Then the AI produces a structured plan — typically 5 to 15 milestone steps — with resources, suggested study activities, and estimated time requirements for each step.",
      },
      {
        type: "h2",
        text: "Following Your Learning Path",
      },
      {
        type: "p",
        text: "Each step in your Learning Path shows you what to do and links directly to relevant features in Study Buddy. A step about a particular chapter might link to the Study Lab with a suggested prompt for generating a quiz on that chapter. A step about practicing past papers might link to the relevant assignment type. The path is not just a to-do list — it is an integrated study plan built into the fabric of the app.",
      },
      {
        type: "p",
        text: "As you complete each step, you mark it as done. Your progress is shown as a percentage at the top of your path, and the Dashboard reflects your Learning Path activity in the overall progress view. Completing steps also earns you study streak credit, which is another reason to keep working through your path consistently.",
      },
      {
        type: "h2",
        text: "Adapting Your Path Over Time",
      },
      {
        type: "p",
        text: "Real learning is rarely linear. You might breeze through two steps in an evening and then find the third step much harder than expected. Or a new topic might be added to your curriculum after you generated your original path. Study Buddy allows you to edit and adapt your Learning Path at any time. You can add steps, remove steps that are no longer relevant, reorder the sequence, or ask the AI to regenerate sections based on new information.",
      },
      {
        type: "tip",
        text: "Create a separate Learning Path for each of your exam modules. Having multiple active paths lets you switch between subjects without losing your place, and the Dashboard shows all your paths' progress at a glance.",
      },
      {
        type: "h2",
        text: "Using Learning Paths for Revision",
      },
      {
        type: "p",
        text: "Learning Paths are not just for learning new material — they are equally powerful for revision. Create a 'Revision Path' for an upcoming exam and ask the AI to generate a compressed version of the full curriculum, focusing only on the most exam-relevant topics. This gives you a lean, efficient revision schedule that prioritizes high-yield material over exhaustive coverage.",
      },
      {
        type: "conclusion",
        text: "Stop guessing what to study next. With Learning Paths, you always have a clear, AI-mapped route from where you are to where you need to be. Create your first path today and experience the clarity that comes from studying with a plan.",
      },
    ],
    relatedSlugs: ["how-to-use-ai-study-lab", "tracking-progress-on-your-dashboard"],
  },

  {
    slug: "using-prescribed-books-library",
    title: "Using the Prescribed Books Library in Study Buddy",
    date: "2026-09-11",
    readTime: "5 min read",
    category: "Feature Guide",
    categoryColor: "violet",
    excerpt:
      "The Prescribed Books feature gives you a dedicated space to store, read, and analyze your course textbooks — with AI that can answer questions about any chapter on demand.",
    featureSection: {
      label: "Books Library",
      description: "Your digital textbook shelf with AI-powered chapter analysis",
      steps: [
        { icon: "📚", label: "Add your prescribed textbooks to your library" },
        { icon: "📖", label: "Read chapters in a clean, distraction-free reader" },
        { icon: "🤖", label: "Ask AI questions about any chapter" },
        { icon: "📝", label: "Highlight & annotate with AI explanations" },
      ],
    },
    content: [
      {
        type: "intro",
        text: "Textbooks are the backbone of most academic courses, but they are also notoriously hard to study effectively. Dense prose, technical language, and chapters that assume prior knowledge you may not have — these make textbooks a frustrating experience for many students. The Prescribed Books Library in Study Buddy gives you a smarter way to read and learn from your course materials.",
      },
      {
        type: "h2",
        text: "Setting Up Your Book Library",
      },
      {
        type: "p",
        text: "Navigate to the Books section from the navigation menu. To add a book, click 'Add Prescribed Book' and enter the title, author, subject, and optionally upload the PDF version. You can also add physical books without a PDF — in this case you can still use the section notes and AI question features by manually entering relevant text. Once added, your book appears on your library shelf, organized by the subject module it belongs to.",
      },
      {
        type: "h2",
        text: "The Clean Reading Experience",
      },
      {
        type: "p",
        text: "If you have uploaded a PDF, you can read it directly within Study Buddy using the built-in reader. The reader is designed to be distraction-free — no advertisements, no sidebars, just the text you need to read. You can adjust font size and zoom level, and the reader remembers your position so you can pick up exactly where you left off across devices.",
      },
      {
        type: "p",
        text: "One feature many students find particularly helpful is the split-view mode. In split view, the book appears on one side of the screen while an AI chat panel appears on the other. As you read, you can highlight any sentence or paragraph and instantly ask the AI to explain it in simpler terms, give a real-world example, or connect it to something else in your curriculum.",
      },
      {
        type: "h2",
        text: "AI Chapter Analysis",
      },
      {
        type: "p",
        text: "Every chapter of your uploaded textbook can be sent to the AI for analysis. Choose from several analysis modes: Summary (get the key points of the chapter in a condensed format), Concept Map (the AI identifies the main concepts and how they relate to each other), Quiz Generation (create practice questions from the chapter), or Key Vocabulary (extract and define all technical terms introduced in the chapter).",
      },
      {
        type: "p",
        text: "The Key Vocabulary feature is especially useful in subjects like Biology, Chemistry, Law, and Economics where mastering terminology is half the battle. The AI extracts every subject-specific term, provides a clear definition, and adds an example sentence showing the term used in context. This becomes your custom glossary for the chapter.",
      },
      {
        type: "h2",
        text: "Highlighting and Annotations",
      },
      {
        type: "p",
        text: "While reading, you can highlight text in different colors (yellow for important, blue for definitions, red for things you do not understand yet) and add notes alongside any highlight. All your highlights and notes are saved and searchable later. Before an exam, you can filter your highlights by color to quickly review all the definitions or all the things you flagged as unclear.",
      },
      {
        type: "tip",
        text: "Use the red highlight for anything you do not fully understand as you read. At the end of each reading session, go back through your red highlights and ask the AI to explain each one. This turns passive confusion into active learning.",
      },
      {
        type: "h2",
        text: "Connecting Books to Your Modules",
      },
      {
        type: "p",
        text: "When you assign a book to a module, Study Buddy creates a connection between that book's content and your other study materials for that module. The Auto-Organizer can suggest which notes connect to which chapters. The Learning Path feature can reference specific chapters as part of your study roadmap. And the Study Lab can combine your book content with your own notes to generate more comprehensive quizzes and summaries.",
      },
      {
        type: "conclusion",
        text: "Your textbooks hold everything you need to pass your exams — but only if you can actually learn from them. The Prescribed Books Library makes your textbooks interactive, searchable, and AI-assisted so that every reading session produces real understanding rather than time spent staring at words.",
      },
    ],
    relatedSlugs: ["how-to-use-ai-study-lab", "organizing-studies-with-auto-organizer"],
  },

  {
    slug: "how-the-ad-supported-free-model-works",
    title: "How Study Buddy's Ad-Supported Free Model Works",
    date: "2026-09-13",
    readTime: "4 min read",
    category: "About",
    categoryColor: "slate",
    excerpt:
      "Study Buddy is free for every student. Here is a transparent explanation of how the ad-supported model works, what you see when, and why we chose this approach over subscriptions.",
    featureSection: {
      label: "Free Model",
      description: "Watch a short ad → unlock AI features → no subscription needed",
      steps: [
        { icon: "🆓", label: "Core features always free, no account required to read" },
        { icon: "📺", label: "Short rewarded ad unlocks advanced AI generation" },
        { icon: "⏱️", label: "Ad access lasts for a session — no repeated interruptions" },
        { icon: "🚫", label: "No fake paywalls or dark patterns" },
      ],
    },
    content: [
      {
        type: "intro",
        text: "One of the most common questions we get about Study Buddy is: 'If it is free, what is the catch?' There is no catch — but there is a model, and we want to be completely transparent about how it works. This post explains exactly what is free, what requires watching an ad, and why we chose ads over subscriptions.",
      },
      {
        type: "h2",
        text: "What Is Always Free",
      },
      {
        type: "p",
        text: "The core of Study Buddy is completely free with no time limits, no trial periods, and no credit card required. This includes: creating modules and subjects, adding and tracking assignments, using the Dashboard to monitor your progress, reading books in the Library, using the Learning Path feature, and accessing the Community Hub. You can use these features every day for an entire semester at zero cost.",
      },
      {
        type: "h2",
        text: "What the Short Ad Unlocks",
      },
      {
        type: "p",
        text: "Advanced AI generation features — such as deep quiz generation from uploaded materials, detailed chapter summaries, and comprehensive learning path creation — require watching a short advertisement before each AI generation session. The ad typically lasts 15 to 30 seconds. After watching, your AI access is unlocked for the current session so you can generate multiple quizzes and summaries without seeing another ad until you start a new session.",
      },
      {
        type: "p",
        text: "This is called a 'rewarded ad' model. You watch an ad, you get something of value in return. This is the same model used by popular mobile games and apps worldwide, and unlike subscription models, it means access is always equal — a student who cannot afford a monthly fee gets the exact same experience as anyone else.",
      },
      {
        type: "h2",
        text: "Why We Chose Ads Over Subscriptions",
      },
      {
        type: "p",
        text: "We built Study Buddy because we believe every student deserves good AI homework help regardless of their family's financial situation. Subscription models — even at low prices — create a two-tier system where wealthier students get better tools. An ad-supported model eliminates this inequality. A 30-second ad is something every student can 'pay' regardless of their economic background.",
      },
      {
        type: "p",
        text: "We also believe that ads should be honest and non-intrusive. Study Buddy does not show ads during your reading sessions. There are no pop-up ads that interrupt your work. Ads only appear when you specifically request access to an advanced AI feature, giving you full control over when you engage with them.",
      },
      {
        type: "h2",
        text: "How Ads Are Delivered",
      },
      {
        type: "p",
        text: "Ads in Study Buddy are powered by Google AdSense (on the web version) and Google AdMob (on the Android app). Both are industry-standard platforms that deliver age-appropriate, high-quality advertisements from reputable brands. The ad content is matched to your general interest profile in accordance with Google's privacy policies. You can opt out of personalized ads by visiting your Google Ad Settings at any time.",
      },
      {
        type: "h2",
        text: "Privacy and Advertising",
      },
      {
        type: "p",
        text: "Study Buddy does not sell your personal study data to advertisers. The ad targeting is handled entirely by Google's platform based on browser-level signals, not by anything Study Buddy shares with third parties. For a complete description of how data is handled, please read our Privacy Policy, which is linked in the footer of every page.",
      },
      {
        type: "tip",
        text: "Support us for free: sharing Study Buddy with a classmate or leaving a review on the Play Store helps us reach more students — and every additional user makes the app more sustainable without costing you anything.",
      },
      {
        type: "conclusion",
        text: "Study Buddy's free model is not a gimmick — it is a deliberate choice to make quality AI study tools accessible to every student. A 30-second ad for a full session of AI-powered learning is a trade we think is more than fair, and we will always be transparent about exactly how it works.",
      },
    ],
    relatedSlugs: ["getting-started-sign-up-and-first-steps", "tracking-progress-on-your-dashboard"],
  },

  {
    slug: "getting-started-sign-up-and-first-steps",
    title: "Getting Started with Study Buddy: Sign Up & Your First Steps",
    date: "2026-09-15",
    readTime: "5 min read",
    category: "Getting Started",
    categoryColor: "blue",
    excerpt:
      "New to Study Buddy? This complete beginner's guide walks you through account creation, your first login, setting up your modules, and making the most of your first study session.",
    featureSection: {
      label: "Getting Started",
      description: "From zero to your first AI-powered study session in 5 minutes",
      steps: [
        { icon: "📧", label: "Create your free account with email" },
        { icon: "📚", label: "Set up your modules & subjects" },
        { icon: "📅", label: "Add your first assignments & deadlines" },
        { icon: "🚀", label: "Jump into your first AI Study Lab session" },
      ],
    },
    content: [
      {
        type: "intro",
        text: "Getting started with a new study app can feel like adding more work to your already-busy schedule. Study Buddy is designed to be up and running in under five minutes — and this guide will get you there. By the end of this post you will have an account, your modules set up, your first assignments added, and a clear picture of where to go next.",
      },
      {
        type: "h2",
        text: "Step 1: Creating Your Account",
      },
      {
        type: "p",
        text: "Visit profilegenius.fun or open the Study Buddy Android app. On the landing page, click 'Get started free'. You will be taken to the sign-up screen where you can create an account using your email address. Choose a strong password, confirm it, and click 'Create account'. You will receive a verification email — click the link in that email to verify your address and enable cloud sync across your devices.",
      },
      {
        type: "p",
        text: "You do not need to add any payment information. There is no credit card required and no trial period — your account is free immediately and indefinitely. After confirming your email, log in and you will land on the Welcome screen.",
      },
      {
        type: "h2",
        text: "Step 2: Accepting the License Agreement",
      },
      {
        type: "p",
        text: "The first time you access the app, you will be shown the End-User License Agreement (EULA). This is a straightforward document that outlines how the software works and what to expect. Read it, and if you agree, click 'Accept'. You only need to do this once. The EULA is always available for reading in the app's footer if you want to revisit it.",
      },
      {
        type: "h2",
        text: "Step 3: Setting Up Your Modules",
      },
      {
        type: "p",
        text: "After accepting the EULA, you will be guided through a quick setup. The most important step here is adding your modules — these are your academic subjects or courses (e.g., Mathematics, English Literature, Biology Grade 11). Click 'Add Module', enter the name and optionally a course code, and save. Add all the subjects you are currently studying. You can always add, edit, or remove modules later from the Modules page.",
      },
      {
        type: "p",
        text: "When setting up a module, you can also set a preference for terminology: if your institution uses 'Subjects' instead of 'Modules', you can switch this in Settings and the entire app will update its language to match. Small detail, big difference for how natural the app feels.",
      },
      {
        type: "h2",
        text: "Step 4: Adding Your First Assignments",
      },
      {
        type: "p",
        text: "Once your modules are set up, head to the Assignments page and start entering your upcoming tasks. Look at your class syllabus or assignment calendar and add everything due in the next four weeks. Include the assignment name, the module it belongs to, and the due date. This step takes a few minutes but pays off immediately — the Dashboard will start showing your deadline calendar right away.",
      },
      {
        type: "tip",
        text: "Be thorough when adding assignments at the start. Enter tests, quizzes, presentations, and projects — not just essays and homework. The more complete your picture is, the better the AI's prioritization and insights will be.",
      },
      {
        type: "h2",
        text: "Step 5: Your First Study Lab Session",
      },
      {
        type: "p",
        text: "Now that your app is set up, it is time to experience the core feature. Go to Study Lab, select the module you want to study, and upload a piece of your study material — a chapter PDF, a page of notes, or paste some text. Click 'Generate Quiz' and within a few seconds you will have a personalized quiz ready to test your knowledge. Take the quiz, see your score, and review any explanations for questions you missed.",
      },
      {
        type: "h2",
        text: "Tips for Your First Week",
      },
      {
        type: "list",
        items: [
          "Check the Dashboard every morning before you start studying — it will tell you what needs attention today.",
          "Try the Auto-Organizer by uploading all your semester's PDFs in one go and letting it sort them for you.",
          "Create one Learning Path for your hardest subject to give the AI a chance to map your revision plan.",
          "Add the Prescribed Books for your most challenging courses to unlock AI chapter analysis.",
          "Turn on notifications so you never miss an assignment deadline reminder.",
        ],
      },
      {
        type: "conclusion",
        text: "Study Buddy is designed around one idea: getting out of the way of your learning and doing the organizational and analytical heavy lifting for you. The five-minute setup investment pays off every single study session from here on out. Welcome to a smarter way to study.",
      },
    ],
    relatedSlugs: ["how-to-use-ai-study-lab", "organizing-studies-with-auto-organizer"],
  },
];

export function getPostBySlug(slug) {
  return blogPosts.find((p) => p.slug === slug) || null;
}

export function getRelatedPosts(slugs) {
  return slugs.map((s) => blogPosts.find((p) => p.slug === s)).filter(Boolean);
}

export const categoryColors = {
  blue: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  purple: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  indigo: { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
  amber: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-200" },
  violet: { bg: "bg-violet-100", text: "text-violet-700", border: "border-violet-200" },
  slate: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
};
