import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  leadName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, message, leadName } = await req.json() as EmailRequest;

    // Validação básica
    if (!to || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios em falta: to, subject, message" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Obter a API key do Resend das variáveis de ambiente
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      // Fallback: Se não houver API key, retornar erro informativo
      return new Response(
        JSON.stringify({ 
          error: "RESEND_API_KEY não configurada", 
          fallback: true,
          mailto: `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
        }),
        { 
          status: 503, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Enviar email via Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "NeuroBalance <geral.neurobalance@gmail.com>",
        to: [to],
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0d9488 0%, #06b6d4 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">NeuroBalance</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Neurofeedback & Bem-Estar</p>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
            </div>
            <div style="background: #1f2937; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                NeuroBalance - Neurofeedback & Bem-Estar<br>
                geral.neurobalance@gmail.com
              </p>
            </div>
          </div>
        `,
        text: message,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      console.error("Resend API error:", errorData);
      
      return new Response(
        JSON.stringify({ 
          error: "Erro ao enviar email via Resend", 
          details: errorData,
          fallback: true,
          mailto: `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const result = await resendResponse.json();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email enviado com sucesso para ${to}`,
        id: result.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

