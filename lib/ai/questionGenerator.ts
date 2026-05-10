import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

export interface GeneratedQuestion {
  text: string
  options: { text: string; is_correct: boolean }[]
  explanation: string
}

export async function generateQuestions(topic: string, count: number = 5): Promise<GeneratedQuestion[]> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `Sen bir eğitim içeriği uzmanısın. Verilen konuya göre Türkçe çoktan seçmeli sorular üretiyorsun.
Her soru için tam olarak 4 şık üret, yalnızca 1 tanesi doğru olsun.
Yanıtını geçerli bir JSON dizisi olarak ver, başka açıklama ekleme.
Format: [{"text": "soru metni", "options": [{"text": "şık A", "is_correct": false}, ...], "explanation": "kısa açıklama"}]`,
    messages: [
      { role: 'user', content: `Şu konu hakkında ${count} adet soru üret: ${topic}` },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Beklenmeyen yanıt tipi')

  const jsonMatch = content.text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('JSON bulunamadı')

  return JSON.parse(jsonMatch[0]) as GeneratedQuestion[]
}
