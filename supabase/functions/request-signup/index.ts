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
    const { email, password, origin } = await req.json();

    if (!email?.trim() || !password?.trim()) {
      return new Response(
        JSON.stringify({ error: "Email and password are required." }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !BREVO_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: missing env variables." }),
        { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email: email,
      password: password,
      redirectTo: origin ? `${origin}/signup` : "https://craft-connect-six.vercel.app/signup",
    });

    if (linkError) {
      return new Response(
        JSON.stringify({ error: linkError.message }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const rawLink = linkData.properties.action_link;
    const urlHashOrSearch = rawLink.includes("#") ? rawLink.substring(rawLink.indexOf("#")) : rawLink.substring(rawLink.indexOf("?"));
    const queryString = urlHashOrSearch.replace("#", "?");
    
    // Force the link to point to EXACTLY the requested origin/signup to bypass Supabase dashboard Site URL fallbacks
    const actionLink = origin ? `${origin}/signup${queryString}` : `https://craft-connect-six.vercel.app/signup${queryString}`;

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "accept": "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "CraftConnect Security", email: "rakeshketan28@gmail.com" },
        to: [{ email: email }],
        subject: "Verify Your CraftConnect Account",
        htmlContent: `
          <h3>Welcome to CraftConnect!</h3>
          <p>You recently tried to create an account. Please verify your email by clicking the link below:</p>
          <a href="${actionLink}" style="display:inline-block;padding:10px 20px;background-color:#2b2017;color:white;text-decoration:none;border-radius:4px;">Verify Email</a>
          <p>If you did not request this, you can safely ignore this email.</p>
        `,
        tags: ["signup-verification"],
        tracking: {
            clicks: false,
            open: false
        }
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
      JSON.stringify({ success: true, message: "Verification link sent" }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});
