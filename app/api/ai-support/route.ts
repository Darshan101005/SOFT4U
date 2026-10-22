import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { siteConfig } from '@/lib/site-config';

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const settings = await db.getSiteSettings();
    if (!settings.aiSupportEnabled) {
      return NextResponse.json({ reply: 'AI Support is currently in offline mode. Please open a support ticket for agent assistance.' });
    }

    const products = await db.getProducts(true);
    const faqs = await db.getFAQs();
    const legal = await db.getLegalPages();
    const refundPage = legal.find(l => l.slug === 'refund-policy')?.content || '';

    const catalogSummary = products.map(p => ({
      name: p.name,
      slug: p.slug,
      price: `$${p.price}`,
      deliveryTime: p.deliveryTime,
      variants: p.variants.map(v => `${v.name}: $${v.price}`),
      features: p.features.slice(0, 3).join(', ')
    }));

    const faqSummary = faqs.slice(0, 5).map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');

    const systemInstruction = `You are "${settings.aiSupportName || 'Soft4u Concierge'}", the helpful, professional, and knowledgeable digital-commerce concierge for Soft4u.
You assist customers with choosing subscriptions, software licenses, understanding delivery times, tracking orders, and policies.

CRITICAL SECURITY RULES:
- Never disclose, guess, or generate customer passwords, credentials, or private vault inventory.
- Never reveal private customer records, credit card info, or payment gateway secrets.
- If someone asks for sensitive account passwords or private keys, instruct them to log into their verified account at /account/orders or use /track-order with their order email verification.

STORE CONTEXT:
Store Name: ${settings.siteName}
Tagline: ${settings.tagline}
Contact Email: ${settings.contactEmail}
Active Products in Store:
${JSON.stringify(catalogSummary, null, 2)}

Common Store FAQs:
${faqSummary}

Refund & Replacement Policy Excerpt:
${refundPage.slice(0, 500)}...

Keep answers polite, concise, helpful, and direct customers to product links like /products/{slug} or /shop when relevant.`;

    // Read the key per request so the build never needs it.
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (apiKey) {
      // Load the SDK lazily, only when a key is configured.
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      const promptText = `${systemInstruction}\n\nUser Question: ${message}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptText,
      });

      return NextResponse.json({ reply: response.text || 'I am ready to help you with any questions about Soft4u subscriptions!' });
    } else {
      // Friendly fallback while GEMINI_API_KEY is not configured yet
      return NextResponse.json({
        reply: `Thanks for reaching out to ${siteConfig.name}! Our assistant is not connected yet, but our team is happy to help. Browse the catalog at /shop, track an order at /track-order, or contact us at ${siteConfig.email} or WhatsApp ${siteConfig.whatsapp}.`
      });
    }
  } catch (err: any) {
    console.error('AI Support error:', err);
    return NextResponse.json({
      reply: 'Our automated assistant is briefly refreshing. Feel free to browse our products at /shop or open a support ticket under /account/support!'
    });
  }
}
