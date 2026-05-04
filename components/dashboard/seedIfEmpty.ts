import { createCharge } from "../../db/charges";
import { listContacts, createContact } from "../../db/contacts";
import { createLine } from "../../db/chargeLines";
import { createTemplate } from "../../db/chargeTemplates";
import { getDb } from "../../db/database";

// Inserta datos de prueba la primera vez que carga el dashboard (cuando no hay contactos).
// Cada contacto y período está elegido para ejercitar un caso distinto de la UI —
// no son datos genéricos, cada uno tiene un propósito específico documentado abajo.

// ── IDs ──────────────────────────────────────────────────────────────────────
// Charges:  ch-f# feb · ch-m# mar · ch-a# abr · ch# may
// Lines:    lf# feb  · lm# mar  · la# abr  · l# may
// El sufijo numérico coincide con el contacto (1=Ana, 2=Luis, 3=María, 4=Carlos, 5=Sofía).

// ── Contactos ─────────────────────────────────────────────────────────────────
// c1  Ana Rodríguez   — deudora habitual; acumula overdue en varios períodos pasados.
//                       Ejercita: el dashboard "Activos" muestra cobros de períodos anteriores,
//                       no solo del período actual.
// c2  Luis Pérez      — pagador puntual; todos los períodos pasados están pagados.
//                       Ejercita: cobros paid NO aparecen en la vista "Activos" del dashboard.
// c3  María Castro    — paga parcialmente; en marzo pagó guardería pero no mensualidad.
//                       Ejercita: cobro con estado overdue aunque tenga líneas paid (estado
//                       derivado del peor estado de sus líneas recursivas).
// c4  Carlos Jiménez  — nuevo en mayo, sin historial previo.
//                       Ejercita: contacto que solo aparece en el período actual, con cobro extra
//                       (matrícula) además de la mensualidad.
// c5  Sofía Vargas    — historial completamente limpio; siempre paga a tiempo.
//                       Ejercita: contacto sin deuda pendiente, útil para verificar que no
//                       aparece en la vista "Activos" una vez pagado.

// ── Plantillas ────────────────────────────────────────────────────────────────
// t1  Mensualidad (recurring) — línea base que tienen todos los contactos.
// t2  Ballet      (extra)     — extra de Ana; no va overdue aunque venza (type='extra').
// t3  Guardería   (recurring) — segunda línea recurring de María; permite el caso de pago parcial.
// t4  Matrícula   (extra)     — cobro único de Carlos en mayo; extra sin historial.
// t5  Uniforme    (extra)     — extra pagado de Sofía en abril; extra que sí se paga.

// ── Escenarios por período ────────────────────────────────────────────────────
//
// FEBRERO 2026
//   Ana   → overdue       Ejercita: cobro de período pasado que sigue sin pagar;
//                         debe aparecer en "Activos" del período actual por ser unpaid.
//   Luis  → paid/sinpe    Ejercita: cobro pagado que no debe aparecer en "Activos".
//   María → paid/transfer Ejercita: cobro con dos líneas, ambas pagadas → estado paid.
//                         También ejercita método de pago 'transfer'.
//   Sofía → paid/cash     Ejercita: método de pago 'cash'.
//
// MARZO 2026
//   Ana   → overdue       Ejercita: segundo período consecutivo sin pagar; ambos
//                         (feb + mar) deben aparecer apilados en "Activos".
//   Luis  → paid/sinpe    Sin novedad; confirma que paid no acumula en "Activos".
//   María → overdue parcial  Guardería pagada (cash), mensualidad overdue.
//                         Ejercita: charge.status = 'overdue' aunque haya líneas paid;
//                         el estado se deriva de la línea recurring más grave.
//   Sofía → paid/sinpe    Sin novedad.
//
// ABRIL 2026
//   Ana   → overdue + extra pending  Mensualidad overdue, ballet (extra) sigue pending.
//                         Ejercita: línea extra NO transiciona a overdue aunque la
//                         charge esté overdue; solo las recurring van overdue.
//   Luis  → paid/transfer Sin novedad; ejercita método 'transfer' en período reciente.
//   María → pending       due_date al 30 de abril — aún no ha vencido al cargar el seed.
//                         Ejercita: cobro reciente que todavía está pending, no overdue.
//   Sofía → paid + extra paid  Mensualidad + uniforme (extra) ambos pagados.
//                         Ejercita: extra que sí se paga; charge fully paid con líneas mixtas.
//
// MAYO 2026 (período actual)
//   Ana   → pending       Ejercita: cobro del período actual conviviendo con overdue
//                         de feb/mar/abr en la misma vista "Activos".
//   Luis  → pending       Ejercita: contacto puntual con un solo cobro pendiente este mes.
//   María → pending       Ejercita: contacto con deuda de mar + cobro nuevo de mayo.
//   Carlos→ pending       Ejercita: primer cobro del contacto (mensualidad + matrícula extra).
//   Sofía → pending       Ejercita: contacto sin deuda previa; solo aparece en mayo.

export function seedIfEmpty() {
  const contacts = listContacts();
  if (contacts.length > 0) return;

  const db = getDb();

  // ── Contactos ──────────────────────────────────────────────────────────────
  createContact({ id: "c1", name: "Ana Rodríguez",  phone: "88001234", email: null,               notes: "Lucas + Clarita",        monthly_amount: 380000 });
  createContact({ id: "c2", name: "Luis Pérez",     phone: "88005678", email: "luis@gmail.com",   notes: null,                     monthly_amount: 210000 });
  createContact({ id: "c3", name: "María Castro",   phone: "87771234", email: null,               notes: "Guardería lunes–viernes", monthly_amount: 210000 });
  createContact({ id: "c4", name: "Carlos Jiménez", phone: "86660000", email: null,               notes: "Nuevo ingreso mayo",      monthly_amount: 210000 });
  createContact({ id: "c5", name: "Sofía Vargas",   phone: "89990000", email: "sofia@gmail.com",  notes: null,                     monthly_amount: 210000 });

  // ── Plantillas ─────────────────────────────────────────────────────────────
  createTemplate({ id: "t1", concept: "Mensualidad", amount: 210000, type: "recurring" });
  createTemplate({ id: "t2", concept: "Ballet",      amount:  25000, type: "extra" });
  createTemplate({ id: "t3", concept: "Guardería",   amount:  40000, type: "recurring" });
  createTemplate({ id: "t4", concept: "Matrícula",   amount:  50000, type: "extra" });
  createTemplate({ id: "t5", concept: "Uniforme",    amount:  15000, type: "extra" });

  // ── Febrero 2026 ──────────────────────────────────────────────────────────

  createCharge({ id: "ch-f1", contact_id: "c1", period: "2026-02", due_date: "2026-02-05" });
  createLine({ id: "lf1", charge_id: "ch-f1", concept: "Mensualidad febrero", amount: 380000, description: "Lucas + Clarita", type: "recurring" });

  createCharge({ id: "ch-f2", contact_id: "c2", period: "2026-02", due_date: "2026-02-05" });
  createLine({ id: "lf2", charge_id: "ch-f2", concept: "Mensualidad febrero", amount: 210000, description: null, type: "recurring" });

  createCharge({ id: "ch-f3", contact_id: "c3", period: "2026-02", due_date: "2026-02-05" });
  createLine({ id: "lf3", charge_id: "ch-f3", concept: "Mensualidad febrero", amount: 210000, description: null, type: "recurring" });
  createLine({ id: "lf4", charge_id: "ch-f3", concept: "Guardería febrero",   amount:  40000, description: null, type: "recurring" });

  createCharge({ id: "ch-f5", contact_id: "c5", period: "2026-02", due_date: "2026-02-05" });
  createLine({ id: "lf5", charge_id: "ch-f5", concept: "Mensualidad febrero", amount: 210000, description: null, type: "recurring" });

  // ── Marzo 2026 ────────────────────────────────────────────────────────────

  createCharge({ id: "ch-m1", contact_id: "c1", period: "2026-03", due_date: "2026-03-05" });
  createLine({ id: "lm1", charge_id: "ch-m1", concept: "Mensualidad marzo", amount: 380000, description: "Lucas + Clarita", type: "recurring" });

  createCharge({ id: "ch-m2", contact_id: "c2", period: "2026-03", due_date: "2026-03-05" });
  createLine({ id: "lm2", charge_id: "ch-m2", concept: "Mensualidad marzo", amount: 210000, description: null, type: "recurring" });

  // María mar: dos líneas recurring — guardería se paga, mensualidad no.
  // Resultado: charge queda overdue aunque lm4 esté paid.
  createCharge({ id: "ch-m3", contact_id: "c3", period: "2026-03", due_date: "2026-03-05" });
  createLine({ id: "lm3", charge_id: "ch-m3", concept: "Mensualidad marzo", amount: 210000, description: null, type: "recurring" });
  createLine({ id: "lm4", charge_id: "ch-m3", concept: "Guardería marzo",   amount:  40000, description: null, type: "recurring" });

  createCharge({ id: "ch-m5", contact_id: "c5", period: "2026-03", due_date: "2026-03-05" });
  createLine({ id: "lm5", charge_id: "ch-m5", concept: "Mensualidad marzo", amount: 210000, description: null, type: "recurring" });

  // ── Abril 2026 ────────────────────────────────────────────────────────────

  // Ana abr: recurring overdue + extra ballet pending.
  // Ballet no vence aunque la charge esté overdue (type='extra').
  createCharge({ id: "ch-a1", contact_id: "c1", period: "2026-04", due_date: "2026-04-02" });
  createLine({ id: "la1", charge_id: "ch-a1", concept: "Mensualidad abril", amount: 380000, description: "Lucas + Clarita", type: "recurring" });
  createLine({ id: "la2", charge_id: "ch-a1", concept: "Ballet",            amount:  25000, description: "Clarita",         type: "extra" });

  createCharge({ id: "ch-a2", contact_id: "c2", period: "2026-04", due_date: "2026-04-02" });
  createLine({ id: "la3", charge_id: "ch-a2", concept: "Mensualidad abril", amount: 210000, description: null, type: "recurring" });

  // María abr: due_date al 30 — no ha vencido al cargar el seed, queda pending.
  createCharge({ id: "ch-a3", contact_id: "c3", period: "2026-04", due_date: "2026-04-30" });
  createLine({ id: "la4", charge_id: "ch-a3", concept: "Mensualidad abril", amount: 210000, description: null, type: "recurring" });
  createLine({ id: "la5", charge_id: "ch-a3", concept: "Guardería abril",   amount:  40000, description: null, type: "recurring" });

  // Sofía abr: mensualidad recurring + uniforme extra, ambos pagados.
  // Ejercita: charge fully paid con líneas de distinto type.
  createCharge({ id: "ch-a5", contact_id: "c5", period: "2026-04", due_date: "2026-04-02" });
  createLine({ id: "la6", charge_id: "ch-a5", concept: "Mensualidad abril", amount: 210000, description: null, type: "recurring" });
  createLine({ id: "la7", charge_id: "ch-a5", concept: "Uniforme",          amount:  15000, description: null, type: "extra" });

  // ── Mayo 2026 (período actual) ────────────────────────────────────────────

  createCharge({ id: "ch1", contact_id: "c1", period: "2026-05", due_date: "2026-05-02" });
  createLine({ id: "l1", charge_id: "ch1", concept: "Mensualidad mayo", amount: 380000, description: "Lucas + Clarita", type: "recurring" });
  createLine({ id: "l2", charge_id: "ch1", concept: "Ballet",           amount:  25000, description: "Clarita",         type: "extra" });

  createCharge({ id: "ch2", contact_id: "c2", period: "2026-05", due_date: "2026-05-02" });
  createLine({ id: "l3", charge_id: "ch2", concept: "Mensualidad mayo", amount: 210000, description: null, type: "recurring" });

  createCharge({ id: "ch3", contact_id: "c3", period: "2026-05", due_date: "2026-05-15" });
  createLine({ id: "l4", charge_id: "ch3", concept: "Mensualidad mayo", amount: 210000, description: null, type: "recurring" });
  createLine({ id: "l5", charge_id: "ch3", concept: "Guardería mayo",   amount:  40000, description: null, type: "recurring" });

  createCharge({ id: "ch4", contact_id: "c4", period: "2026-05", due_date: "2026-05-02" });
  createLine({ id: "l8", charge_id: "ch4", concept: "Mensualidad mayo", amount: 210000, description: null, type: "recurring" });
  createLine({ id: "l9", charge_id: "ch4", concept: "Matrícula",        amount:  50000, description: null, type: "extra" });

  createCharge({ id: "ch5", contact_id: "c5", period: "2026-05", due_date: "2026-05-02" });
  createLine({ id: "l10", charge_id: "ch5", concept: "Mensualidad mayo", amount: 210000, description: null, type: "recurring" });

  // ── Aplicar estados de pago ───────────────────────────────────────────────
  // Se usa SQL directo porque createLine siempre inserta con status='pending';
  // no hay función pública que acepte el estado inicial como parámetro.
  const now = new Date().toISOString();

  // Febrero ─────────────────────────────────────────────────────────────────
  db.runSync(`UPDATE charge_lines SET status='overdue',                          updated_at=? WHERE id='lf1'`, now);
  db.runSync(`UPDATE charges       SET status='overdue',                         updated_at=? WHERE id='ch-f1'`, now);

  db.runSync(`UPDATE charge_lines SET status='paid', payment_method='sinpe',    paid_at='2026-02-04', updated_at=? WHERE id='lf2'`, now);
  db.runSync(`UPDATE charges       SET status='paid',                            updated_at=? WHERE id='ch-f2'`, now);

  db.runSync(`UPDATE charge_lines SET status='paid', payment_method='transfer', paid_at='2026-02-06', updated_at=? WHERE id IN ('lf3','lf4')`, now);
  db.runSync(`UPDATE charges       SET status='paid',                            updated_at=? WHERE id='ch-f3'`, now);

  db.runSync(`UPDATE charge_lines SET status='paid', payment_method='cash',     paid_at='2026-02-05', updated_at=? WHERE id='lf5'`, now);
  db.runSync(`UPDATE charges       SET status='paid',                            updated_at=? WHERE id='ch-f5'`, now);

  // Marzo ───────────────────────────────────────────────────────────────────
  db.runSync(`UPDATE charge_lines SET status='overdue',                          updated_at=? WHERE id='lm1'`, now);
  db.runSync(`UPDATE charges       SET status='overdue',                         updated_at=? WHERE id='ch-m1'`, now);

  db.runSync(`UPDATE charge_lines SET status='paid', payment_method='sinpe',    paid_at='2026-03-04', updated_at=? WHERE id='lm2'`, now);
  db.runSync(`UPDATE charges       SET status='paid',                            updated_at=? WHERE id='ch-m2'`, now);

  // María mar: guardería paid, mensualidad overdue → charge overdue (estado del peor recurring)
  db.runSync(`UPDATE charge_lines SET status='overdue',                          updated_at=? WHERE id='lm3'`, now);
  db.runSync(`UPDATE charge_lines SET status='paid', payment_method='cash',     paid_at='2026-03-06', updated_at=? WHERE id='lm4'`, now);
  db.runSync(`UPDATE charges       SET status='overdue',                         updated_at=? WHERE id='ch-m3'`, now);

  db.runSync(`UPDATE charge_lines SET status='paid', payment_method='sinpe',    paid_at='2026-03-05', updated_at=? WHERE id='lm5'`, now);
  db.runSync(`UPDATE charges       SET status='paid',                            updated_at=? WHERE id='ch-m5'`, now);

  // Abril ───────────────────────────────────────────────────────────────────
  // Ana: mensualidad overdue, ballet se queda pending (extra no va overdue)
  db.runSync(`UPDATE charge_lines SET status='overdue',                          updated_at=? WHERE id='la1'`, now);
  db.runSync(`UPDATE charges       SET status='overdue',                         updated_at=? WHERE id='ch-a1'`, now);

  db.runSync(`UPDATE charge_lines SET status='paid', payment_method='transfer', paid_at='2026-04-03', updated_at=? WHERE id='la3'`, now);
  db.runSync(`UPDATE charges       SET status='paid',                            updated_at=? WHERE id='ch-a2'`, now);

  // María abr: queda pending — no se modifica, due_date=2026-04-30 no ha vencido

  // Sofía abr: mensualidad + uniforme pagados → charge fully paid con líneas mixtas
  db.runSync(`UPDATE charge_lines SET status='paid', payment_method='sinpe',    paid_at='2026-04-02', updated_at=? WHERE id IN ('la6','la7')`, now);
  db.runSync(`UPDATE charges       SET status='paid',                            updated_at=? WHERE id='ch-a5'`, now);
}
