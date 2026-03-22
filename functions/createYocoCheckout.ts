// @ts-ignore: Deno npm import syntax
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// @ts-ignore: Deno is a global in Supabase Edge Functions
Deno.serve(async (req: Request) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount, currency = "ZAR", successUrl, cancelUrl, failureUrl, metadata, externalId } = await req.json();

        if (!amount) {
            return Response.json({ error: 'Amount is required' }, { status: 400 });
        }

        // @ts-ignore: Deno is a global in Supabase Edge Functions
        const yocoApiKey = Deno.env.get("YOCO_SECRET_KEY") || Deno.env.get("YOCO_API_KEY");
        if (!yocoApiKey) {
            return Response.json({ error: 'Yoco API key not configured' }, { status: 500 });
        }

        const payload = {
            amount,
            currency,
            successUrl,
            cancelUrl,
            failureUrl,
            metadata,
            externalId
        };

        const response = await fetch("https://payments.yoco.com/api/checkouts", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${yocoApiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            return Response.json({ error: `Yoco API error: ${errorText}` }, { status: response.status });
        }

        const checkout = await response.json();

        return Response.json({
            success: true,
            checkout
        });

    } catch (error: any) {
        return Response.json({ error: error?.message || 'Unknown error' }, { status: 500 });
    }
});
