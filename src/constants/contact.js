export const WHATSAPP_MEMBERSHIP_URL = 'https://wa.me/525521045612';

export function whatsappMembershipLink(planName, sectionLabel = 'membresía') {
  const text = `Hola, me interesa el plan ${planName} (${sectionLabel} Universidad IMCYC).`;
  return `${WHATSAPP_MEMBERSHIP_URL}?text=${encodeURIComponent(text)}`;
}
