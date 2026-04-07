import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { email } = await req.json();

    if (!email?.trim()) {
      return new Response(
        JSON.stringify({ error: "Email is required." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: missing env variables." }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    // 1. Initialize Supabase Admin Client using the Service Role Key
    // This allows us to use Admin APIs which bypass standard auth limits
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 2. Generate the Recovery action_link (bypasses Supabase SMTP)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        // We'll let Supabase handle the redirect based on the site URL,
        // or we could enforce a specific one if set in env.
        redirectTo: Deno.env.get("FRONTEND_URL") || "https://craftconnect.in/login",
      },
    });

    if (linkError) {
      // Return 400 so client knows user likely doesn't exist or it failed
      return new Response(
        JSON.stringify({ error: linkError.message }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const actionLink = linkData.properties.action_link;

    // 3. Email the exact generated actionLink to user via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CraftConnect Security <onboarding@resend.dev>",
        to: [email],
        subject: "Reset Your CraftConnect Password",
        html: `
          <h3>Password Reset Request</h3>
          <p>We received a request to reset your password. Click the link below to securely set a new password:</p>
          <a href="${actionLink}" style="display:inline-block;padding:10px 20px;background-color:#2b2017;color:white;text-decoration:none;border-radius:4px;">Reset Password</a>
          <p>If you did not request this, you can safely ignore this email.</p>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return new Response(
        JSON.stringify({ error: err.message || "Failed to send email." }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Recovery link sent" }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
