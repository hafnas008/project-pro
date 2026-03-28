export async function sendWhatsApp(message, phone = process.env.NEXT_PUBLIC_DEFAULT_PHONE) {
  try {
    await fetch(process.env.NEXT_PUBLIC_NOTIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message })
    })
  } catch (e) { console.error('WhatsApp notify failed', e) }
}
