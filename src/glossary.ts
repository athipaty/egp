// Plain-language explanations for e-GP jargon, shown as tooltips next to the raw terms.

export const ANOUNCE_TYPE_GLOSSARY: Record<string, string> = {
  D0: 'หน่วยงานรัฐเปิดให้เอกชนยื่นข้อเสนอ/ประมูลงานนี้ได้',
  P0: 'แผนงานที่หน่วยงานตั้งใจจะจัดซื้อจัดจ้างในอนาคต ยังไม่เปิดให้ยื่นข้อเสนอ',
  W0: 'ประกาศคนที่ชนะการประมูล/ได้งานนี้ไปแล้ว',
  W2: 'แก้ไขข้อมูลประกาศผู้ชนะที่เคยประกาศไปแล้ว',
  '15': 'ราคากลางที่หน่วยงานประเมินไว้ก่อนจัดซื้อจัดจ้าง',
  B0: 'ร่างเอกสารประกวดราคา เปิดให้แสดงความเห็นก่อนประกาศจริง',
}

export function describeMethod(method?: string | null): string | null {
  if (!method) return null
  if (method.includes('เฉพาะเจาะจง')) return 'หน่วยงานเลือกผู้รับจ้างเองโดยตรง มักเป็นงานวงเงินไม่สูง'
  if (method.includes('e-bidding') || method.includes('อิเล็กทรอนิกส์')) return 'ประมูลออนไลน์ เปิดให้ผู้สนใจทั่วไปยื่นแข่งขันราคา'
  if (method.includes('คัดเลือก')) return 'หน่วยงานเชิญผู้รับจ้างหลายรายมาเสนอราคาแล้วคัดเลือก'
  return null
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diffMs = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}
