-- Datos ficticios para pruebas (DEV_SEED=true). Idempotente: se puede ejecutar en cada arranque.
-- Los correos @opendesk.test no pueden iniciar sesión con Google; sirven para probar asignaciones y la matriz.

INSERT INTO areas_areas (name, description, sla_hours, levels, always_open, week, pause_on_holidays) VALUES
  ('Soporte técnico', 'Fallas de producto, accesos e incidencias técnicas.', 24, 3, false,
   '[["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],null,null]', true),
  ('Facturación', 'Aclaraciones de cobros, facturas y reembolsos.', 12, 2, false,
   '[["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],["09:00","14:00"],null]', true),
  ('Clientes clave', 'Atención prioritaria a cuentas estratégicas.', 4, 2, true,
   '[["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],null,null]', false)
ON CONFLICT (name) DO NOTHING;

-- Niveles: 1 = primer contacto. Soporte usa 3 niveles, Facturación y Clientes clave 2.
INSERT INTO users_users (email, name, role, area_id, level) VALUES
  ('mariana.ruiz@opendesk.test',   'Mariana Ruiz',    'gestor',  NULL, NULL),
  ('jorge.medina@opendesk.test',   'Jorge Medina',    'gestor',  NULL, NULL),
  ('laura.campos@opendesk.test',   'Laura Campos',    'usuario', (SELECT id FROM areas_areas WHERE name = 'Soporte técnico'), 3),
  ('diego.herrera@opendesk.test',  'Diego Herrera',   'usuario', (SELECT id FROM areas_areas WHERE name = 'Soporte técnico'), 2),
  ('sofia.navarro@opendesk.test',  'Sofía Navarro',   'usuario', (SELECT id FROM areas_areas WHERE name = 'Soporte técnico'), 1),
  ('pablo.ibarra@opendesk.test',   'Pablo Ibarra',    'usuario', (SELECT id FROM areas_areas WHERE name = 'Soporte técnico'), 1),
  ('andrea.lozano@opendesk.test',  'Andrea Lozano',   'usuario', (SELECT id FROM areas_areas WHERE name = 'Facturación'), 1),
  ('ricardo.fuentes@opendesk.test','Ricardo Fuentes', 'usuario', (SELECT id FROM areas_areas WHERE name = 'Facturación'), 2),
  ('valeria.ortiz@opendesk.test',  'Valeria Ortiz',   'usuario', (SELECT id FROM areas_areas WHERE name = 'Facturación'), 1),
  ('hector.salinas@opendesk.test', 'Héctor Salinas',  'usuario', (SELECT id FROM areas_areas WHERE name = 'Clientes clave'), 2),
  ('camila.reyes@opendesk.test',   'Camila Reyes',    'usuario', (SELECT id FROM areas_areas WHERE name = 'Clientes clave'), 1),
  ('tomas.aguirre@opendesk.test',  'Tomás Aguirre',   'usuario', NULL, NULL)
ON CONFLICT (email) DO NOTHING;

INSERT INTO areas_holidays (day, name) VALUES
  ('2026-11-16', 'Día de la Revolución'),
  ('2026-12-25', 'Navidad'),
  ('2027-01-01', 'Año Nuevo'),
  ('2027-02-01', 'Día de la Constitución')
ON CONFLICT (day) DO NOTHING;

-- Catálogo de estatus de seguimiento.
INSERT INTO tickets_statuses (name) VALUES
  ('En diagnóstico'), ('Esperando al cliente'), ('Con proveedor'), ('En pruebas')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------------------------------
-- Tickets de ejemplo: cubren todos los estados con sus campos e historial. Solo se cargan si la tabla
-- de tickets está vacía. Las fechas son relativas al momento de la carga. Sin adjuntos (requieren S3).
-- ---------------------------------------------------------------------------------------------------

-- Ayudantes temporales (viven solo durante esta sesión).
CREATE OR REPLACE FUNCTION pg_temp.u(who text) RETURNS int LANGUAGE sql AS
  $$ SELECT id FROM users_users WHERE email = who || '@opendesk.test' $$;
CREATE OR REPLACE FUNCTION pg_temp.iso(ts timestamptz) RETURNS text LANGUAGE sql AS
  $$ SELECT to_char(ts AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS+00:00') $$;

-- Crea un ticket asignado a `who` (en su área), creado por Mariana Ruiz.
CREATE OR REPLACE FUNCTION pg_temp.ticket(title text, descr text, who text, prio text, client text, email text,
                                         st text, created timestamptz, due_from timestamptz, due_at timestamptz,
                                         tracking text DEFAULT NULL) RETURNS int LANGUAGE sql AS $$
  INSERT INTO tickets_tickets (title, description, area_id, assignee_id, priority, client_name, client_email, status,
                               due_from, due_at, created_by, created_at, status_id)
  SELECT title, descr, u.area_id, u.id, prio, client, email, st, due_from, due_at, pg_temp.u('mariana.ruiz'), created,
         (SELECT id FROM tickets_statuses WHERE name = tracking)
  FROM users_users u WHERE u.id = pg_temp.u(who)
  RETURNING id $$;

-- Agrega un evento a la línea de tiempo.
CREATE OR REPLACE FUNCTION pg_temp.ev(t int, kind text, actor text, at timestamptz, comment text DEFAULT '',
                                     data jsonb DEFAULT '{}', state text DEFAULT NULL, decider text DEFAULT NULL,
                                     decision text DEFAULT '') RETURNS void LANGUAGE sql AS $$
  INSERT INTO tickets_events (ticket_id, kind, actor_id, created_at, comment, data, state, decided_by, decision_comment)
  VALUES (t, kind, pg_temp.u(actor), at, comment, data::json, state, pg_temp.u(decider), decision) $$;

-- Asignación (creación o reasignación) con los datos que usa la aplicación.
CREATE OR REPLACE FUNCTION pg_temp.moved(t int, actor text, at timestamptz, from_who text, to_who text, reason text)
  RETURNS void LANGUAGE sql AS $$
  SELECT pg_temp.ev(t, 'assigned', actor, at, '', jsonb_build_object('from', pg_temp.u(from_who), 'to', pg_temp.u(to_who),
    'area_id', (SELECT area_id FROM users_users WHERE id = pg_temp.u(to_who)), 'reason', reason)) $$;

-- Aviso en la campana.
CREATE OR REPLACE FUNCTION pg_temp.notify(who text, t int, title text, body text, at timestamptz, seen boolean)
  RETURNS void LANGUAGE sql AS $$
  INSERT INTO notifications_notifications (user_id, ticket_id, title, body, created_at, read_at)
  VALUES (pg_temp.u(who), t, title, body, at, CASE WHEN seen THEN at + interval '10 minutes' END) $$;

-- Encuesta enviada (token ficticio: el enlace no es válido).
CREATE OR REPLACE FUNCTION pg_temp.survey(t int, sent timestamptz, rating int, comment text, answered timestamptz)
  RETURNS void LANGUAGE sql AS $$
  INSERT INTO surveys_surveys (ticket_id, email, token_hash, sent_at, expires_at, rating, comment, answered_at)
  SELECT t, client_email, md5(random()::text) || md5(random()::text), sent, sent + interval '7 days', rating,
         coalesce(comment, ''), answered FROM tickets_tickets WHERE id = t $$;

-- Genera el histórico sintético (cerrado) con eventos de primera respuesta, escalamientos, cierres y encuestas.
CREATE OR REPLACE FUNCTION pg_temp.history(n timestamptz) RETURNS void LANGUAGE plpgsql AS $fn$
DECLARE
  tz text := 'America/Mexico_City';
  people int[] := ARRAY(SELECT id FROM users_users WHERE role = 'usuario' AND area_id IS NOT NULL
                        AND email LIKE '%@opendesk.test' ORDER BY id);
  clients text[] := ARRAY['Grupo Andrade', 'Ferretería López', 'Comercial Rivera', 'Distribuidora Sol', 'Hotel Las Palmas',
                          'Constructora Delta', 'Clínica San Rafael', 'Tienda Verde', 'Laboratorios Vida', 'Grupo Aurora',
                          'Transportes Medina', 'Panadería La Espiga', 'Colegio Montessori Norte', 'Abarrotes Don Pepe'];
  titles text[] := ARRAY['No puedo iniciar sesión', 'Error al generar factura', 'Lentitud en el sistema', 'Solicitud de alta de usuario',
                         'Cobro no reconocido', 'Falla en la impresión de tickets', 'Reporte con datos incorrectos',
                         'Cambio de datos fiscales', 'Restablecer contraseña', 'Integración sin sincronizar',
                         'Duda sobre el estado de cuenta', 'Error al cargar archivos', 'Configuración de correo', 'Acceso a la VPN'];
  comments text[] := ARRAY['Muy buena atención, rápida y clara.', 'Resolvieron el problema a la primera.',
                           'Tardaron más de lo esperado, pero quedó resuelto.', 'Excelente seguimiento.',
                           'Me hubiera gustado recibir más avisos del avance.', 'Atención amable y profesional.'];
  sts int[] := ARRAY(SELECT id FROM tickets_statuses ORDER BY id);
  i int; who int; area int; lvl int; sla int; up int; t int; c text; email text;
  created timestamptz; first_at timestamptz; closed timestamptz; due timestamptz;
  frm int; met boolean; committed boolean; outcome text; prio text; hours numeric; r numeric;
BEGIN
  IF array_length(people, 1) IS NULL THEN RETURN; END IF;
  FOR i IN 1..420 LOOP
    -- Fecha y hora de creación (local): 85 % entre semana, horario laboral con picos a media mañana.
    created := (date_trunc('day', (n - (1 + floor(random() * 89)) * interval '1 day') AT TIME ZONE tz)
               + make_interval(hours => CASE WHEN random() < 0.9 THEN 8 + floor(random() * 6 + random() * 5)::int
                                             ELSE floor(random() * 24)::int END, mins => floor(random() * 60)::int))
               AT TIME ZONE tz;
    IF extract(isodow FROM created AT TIME ZONE tz) >= 6 AND random() < 0.7 THEN
      created := created - interval '2 days';
    END IF;
    who := people[1 + floor(random() * array_length(people, 1))::int];
    SELECT u.area_id, u.level, a.sla_hours INTO area, lvl, sla FROM users_users u JOIN areas_areas a ON a.id = u.area_id WHERE u.id = who;
    r := random();
    prio := CASE WHEN r < 0.25 THEN 'alta' WHEN r < 0.75 THEN 'media' ELSE 'baja' END;
    c := CASE WHEN random() < 0.85 THEN clients[1 + floor(random() * array_length(clients, 1))::int] END;
    email := CASE WHEN c IS NOT NULL THEN lower(regexp_replace(translate(c, 'áéíóúñ ', 'aeioun.'), '[^a-z.]', '', 'g')) || '@cliente.test' END;
    -- Primera respuesta: ~80 % dentro del SLA.
    frm := greatest(5, (sla * 60 * power(random(), 1.4) * 1.25)::int);
    met := frm <= sla * 60;
    -- Resolución en horas, más rápida en prioridad alta.
    hours := frm / 60.0 + (CASE prio WHEN 'alta' THEN 6 WHEN 'media' THEN 20 ELSE 40 END) * (0.2 + random() * random() * 3);
    closed := least(created + hours * interval '1 hour', n - interval '30 minutes');
    committed := random() < 0.55;
    outcome := CASE WHEN random() < 0.88 THEN 'resuelto' ELSE 'no_resuelto' END;

    INSERT INTO tickets_tickets (title, description, area_id, assignee_id, priority, client_name, client_email, status, outcome,
                                 due_from, due_at, committed, created_by, created_at, closed_at, status_id)
    VALUES (titles[1 + floor(random() * array_length(titles, 1))::int], 'Ticket histórico generado para la analítica.',
            area, who, prio, c, email, 'cerrado', outcome, created, created + sla * interval '1 hour', committed,
            pg_temp.u('mariana.ruiz'), created, closed,
            CASE WHEN random() < 0.4 THEN sts[1 + floor(random() * array_length(sts, 1))::int] END)
    RETURNING id INTO t;
    INSERT INTO tickets_events (ticket_id, kind, actor_id, created_at, data)
    VALUES (t, 'created', pg_temp.u('mariana.ruiz'), created, json_build_object('to', who));

    -- Sin respuesta a tiempo: la mitad de los incumplimientos termina en auto-escalamiento.
    up := (SELECT id FROM users_users WHERE area_id = area AND level > lvl AND role = 'usuario' ORDER BY random() LIMIT 1);
    IF NOT met AND up IS NOT NULL AND random() < 0.5 THEN
      INSERT INTO tickets_events (ticket_id, kind, actor_id, created_at, data)
      VALUES (t, 'assigned', NULL, created + sla * interval '1 hour',
              json_build_object('from', who, 'to', up, 'area_id', area, 'reason', 'auto'));
      UPDATE tickets_tickets SET assignee_id = up WHERE id = t;
      who := up; frm := greatest(5, (sla * 60 * random() * 0.6)::int); met := true;
      created := created + sla * interval '1 hour';
    ELSIF up IS NOT NULL AND random() < 0.1 THEN
      -- Escalamiento manual aceptado.
      INSERT INTO tickets_events (ticket_id, kind, actor_id, created_at, state, decided_by, data, comment)
      VALUES (t, 'escalate', who, created + interval '1 hour', 'accepted', pg_temp.u('jorge.medina'),
              json_build_object('first_response_min', 60, 'first_response_business_min', 60, 'sla_met', true), 'Requiere apoyo del siguiente nivel.');
      INSERT INTO tickets_events (ticket_id, kind, actor_id, created_at, data)
      VALUES (t, 'assigned', pg_temp.u('jorge.medina'), created + interval '1 hour',
              json_build_object('from', who, 'to', up, 'area_id', area, 'reason', 'escalate'));
      UPDATE tickets_tickets SET assignee_id = up WHERE id = t;
      who := up; created := created + interval '1 hour';
    END IF;

    -- ~6 % llegó al área equivocada y se reasignó a otra.
    IF random() < 0.06 THEN
      up := (SELECT id FROM users_users WHERE role = 'usuario' AND area_id IS NOT NULL AND area_id <> area
             AND users_users.email LIKE '%@opendesk.test' ORDER BY random() LIMIT 1);
      INSERT INTO tickets_events (ticket_id, kind, actor_id, created_at, state, decided_by, data, comment)
      VALUES (t, 'reassign', who, created + interval '30 minutes', 'accepted', pg_temp.u('mariana.ruiz'),
              json_build_object('area_id', (SELECT area_id FROM users_users WHERE id = up)), 'No corresponde a mi área.');
      INSERT INTO tickets_events (ticket_id, kind, actor_id, created_at, data)
      VALUES (t, 'assigned', pg_temp.u('mariana.ruiz'), created + interval '30 minutes',
              json_build_object('from', who, 'to', up, 'area_id', (SELECT area_id FROM users_users WHERE id = up), 'reason', 'reassign'));
      UPDATE tickets_tickets SET assignee_id = up, area_id = (SELECT area_id FROM users_users WHERE id = up) WHERE id = t;
      who := up; created := created + interval '30 minutes';
    END IF;

    -- Algunas propuestas rechazadas antes de la aceptada.
    IF random() < 0.15 THEN
      INSERT INTO tickets_events (ticket_id, kind, actor_id, created_at, state, decided_by, data, comment, decision_comment)
      VALUES (t, 'update', who, created + interval '20 minutes', 'rejected', pg_temp.u('mariana.ruiz'),
              json_build_object('due_at', pg_temp.iso(closed + interval '3 days')), 'Lo reviso la próxima semana.',
              'Se necesita una fecha más cercana.');
    END IF;

    first_at := least(created + frm * interval '1 minute', closed);
    IF committed THEN
      due := first_at + (closed - first_at) * (0.8 + random() * 0.5);
      INSERT INTO tickets_events (ticket_id, kind, actor_id, created_at, state, decided_by, data, comment)
      VALUES (t, 'update', who, first_at, 'accepted', pg_temp.u('mariana.ruiz'),
              json_build_object('due_at', pg_temp.iso(due), 'first_response_min', frm, 'first_response_business_min', frm, 'sla_met', met), 'Atiendo y doy seguimiento.');
      UPDATE tickets_tickets SET due_from = first_at, due_at = due WHERE id = t;
      INSERT INTO tickets_events (ticket_id, kind, actor_id, created_at, state, decided_by, data, comment)
      VALUES (t, 'close', who, closed, 'accepted', pg_temp.u('mariana.ruiz'),
              json_build_object('outcome', outcome, 'committed', true, 'commitment_met', closed <= due), 'Atendido.');
    ELSE
      INSERT INTO tickets_events (ticket_id, kind, actor_id, created_at, state, decided_by, data, comment)
      VALUES (t, 'close', who, first_at, 'accepted', pg_temp.u('jorge.medina'),
              json_build_object('outcome', outcome, 'committed', false, 'first_response_min', frm, 'first_response_business_min', frm, 'sla_met', met), 'Atendido.');
    END IF;

    IF random() < 0.05 THEN
      INSERT INTO tickets_events (ticket_id, kind, actor_id, created_at, comment)
      VALUES (t, 'reopened', pg_temp.u('mariana.ruiz'), closed - interval '1 hour', 'El cliente reportó que el problema regresó.');
    END IF;

    -- Encuesta: 75 % de los resueltos con correo; responde ~55 %; calificaciones sesgadas a 4–5.
    IF outcome = 'resuelto' AND email IS NOT NULL AND random() < 0.75 THEN
      r := random();
      INSERT INTO surveys_surveys (ticket_id, email, token_hash, sent_at, expires_at, rating, comment, answered_at)
      SELECT t, email, md5(random()::text) || md5(random()::text), closed, closed + interval '7 days', x.rating,
             CASE WHEN x.rating IS NOT NULL AND random() < 0.3 THEN comments[1 + floor(random() * array_length(comments, 1))::int] ELSE '' END,
             CASE WHEN x.rating IS NOT NULL THEN least(closed + random() * interval '2 days', n) END
      FROM (SELECT CASE WHEN random() < 0.45 THEN NULL WHEN r < 0.45 THEN 5 WHEN r < 0.75 THEN 4 WHEN r < 0.88 THEN 3
                        WHEN r < 0.95 THEN 2 ELSE 1 END AS rating) x;
    END IF;
  END LOOP;
END $fn$;

DO $$
DECLARE
  n timestamptz := now();
  t int;
  f text;
BEGIN
  IF EXISTS (SELECT 1 FROM tickets_tickets) THEN RETURN; END IF;

  -- ===== Asignado =====================================================================================

  -- 1. Recién creado (semáforo verde).
  t := pg_temp.ticket('No puedo iniciar sesión en el portal de clientes',
    'El cliente indica que el portal rechaza su contraseña desde ayer. Ya intentó restablecerla sin éxito.',
    'sofia.navarro', 'alta', 'Grupo Andrade', 'compras@andrade.test', 'asignado', n - interval '1 hour',
    n - interval '1 hour', n + interval '23 hours');
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '1 hour', '', jsonb_build_object('to', pg_temp.u('sofia.navarro')));
  PERFORM pg_temp.notify('sofia.navarro', t, 'Se te asignó el ticket OD-' || lpad(t::text, 6, '0'), 'No puedo iniciar sesión en el portal de clientes', n - interval '1 hour', false);

  -- 2. Al 85 % de su SLA (amarillo), con estatus de seguimiento y aviso emitido.
  t := pg_temp.ticket('Lentitud al cargar el tablero de ventas',
    'El tablero tarda más de un minuto en mostrar los indicadores del día, sobre todo por la mañana.',
    'pablo.ibarra', 'media', 'Ferretería López', 'sistemas@ferrelopez.test', 'asignado', n - interval '20 hours',
    n - interval '20 hours', n + interval '3 hours 30 minutes', 'En diagnóstico');
  UPDATE tickets_tickets SET sla_warned = true WHERE id = t;
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '20 hours', '', jsonb_build_object('to', pg_temp.u('pablo.ibarra')));
  PERFORM pg_temp.ev(t, 'status', 'mariana.ruiz', n - interval '18 hours', '', '{"name": "En diagnóstico"}');
  f := 'OD-' || lpad(t::text, 6, '0');
  PERFORM pg_temp.notify('pablo.ibarra', t, 'Se te asignó el ticket ' || f, 'Lentitud al cargar el tablero de ventas', n - interval '20 hours', true);
  PERFORM pg_temp.notify('pablo.ibarra', t, 'Se consumió el 80 % del SLA de ' || f, 'Revisa el plazo en el detalle del ticket.', n - interval '1 hour', false);

  -- 3. Con una propuesta rechazada.
  t := pg_temp.ticket('Error 500 al guardar pedidos con descuento',
    'Al capturar un pedido con descuento mayor al 10 % el sistema muestra "Error 500" y no guarda.',
    'sofia.navarro', 'alta', 'Comercial Rivera', 'ti@crivera.test', 'asignado', n - interval '10 hours',
    n - interval '10 hours', n + interval '14 hours');
  f := 'OD-' || lpad(t::text, 6, '0');
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '10 hours', '', jsonb_build_object('to', pg_temp.u('sofia.navarro')));
  PERFORM pg_temp.ev(t, 'update', 'sofia.navarro', n - interval '6 hours',
    'Revisaré la regla de descuentos con el equipo de desarrollo la próxima semana.',
    jsonb_build_object('due_at', pg_temp.iso(n + interval '5 days')), 'rejected', 'mariana.ruiz',
    'La fecha es muy lejana: el cliente no puede facturar. Propón una solución temporal para hoy.');
  PERFORM pg_temp.notify('sofia.navarro', t, 'Tu propuesta de una actualización en ' || f || ' fue rechazada',
    'La fecha es muy lejana: el cliente no puede facturar. Propón una solución temporal para hoy.', n - interval '5 hours', false);

  -- 4. Escalado al nivel 2, con edición y estatus.
  t := pg_temp.ticket('Integración con el ERP sin sincronizar',
    'Los pedidos dejaron de llegar al ERP desde el lunes. El último pedido sincronizado es el 4512.',
    'diego.herrera', 'alta', 'Distribuidora Sol', 'it@dsol.test', 'asignado', n - interval '30 hours',
    n - interval '26 hours', n + interval '20 hours', 'Con proveedor');
  f := 'OD-' || lpad(t::text, 6, '0');
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '30 hours', '', jsonb_build_object('to', pg_temp.u('pablo.ibarra')));
  PERFORM pg_temp.ev(t, 'edited', 'mariana.ruiz', n - interval '29 hours', '', '{"changes": {"priority": ["media", "alta"]}}');
  PERFORM pg_temp.ev(t, 'escalate', 'pablo.ibarra', n - interval '27 hours', 'El error está en el conector del ERP; requiere acceso de nivel 2.',
    '{}', 'accepted', 'mariana.ruiz', 'De acuerdo, que lo revise Diego.');
  PERFORM pg_temp.moved(t, 'mariana.ruiz', n - interval '26 hours', 'pablo.ibarra', 'diego.herrera', 'escalate');
  PERFORM pg_temp.ev(t, 'status', 'jorge.medina', n - interval '20 hours', '', '{"name": "Con proveedor"}');
  PERFORM pg_temp.notify('diego.herrera', t, 'Se te asignó el ticket ' || f, 'Integración con el ERP sin sincronizar', n - interval '26 hours', true);
  PERFORM pg_temp.notify('pablo.ibarra', t, 'Tu propuesta de escalar en ' || f || ' fue aceptada', 'De acuerdo, que lo revise Diego.', n - interval '26 hours', true);

  -- 5. Requiere intervención del Gestor (no hay nivel superior).
  t := pg_temp.ticket('Caída intermitente del timbrado de facturas',
    'El servicio de timbrado responde con tiempo de espera agotado en 3 de cada 10 facturas.',
    'ricardo.fuentes', 'alta', 'Hotel Las Palmas', 'administracion@laspalmas.test', 'asignado', n - interval '15 hours',
    n - interval '12 hours', n + interval '4 hours', 'Con proveedor');
  UPDATE tickets_tickets SET needs_manager = true WHERE id = t;
  f := 'OD-' || lpad(t::text, 6, '0');
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '15 hours', '', jsonb_build_object('to', pg_temp.u('andrea.lozano')));
  PERFORM pg_temp.ev(t, 'escalate', 'andrea.lozano', n - interval '13 hours', 'Es una falla del proveedor de timbrado; necesito apoyo de nivel 2.',
    '{}', 'accepted', 'jorge.medina');
  PERFORM pg_temp.moved(t, 'jorge.medina', n - interval '12 hours', 'andrea.lozano', 'ricardo.fuentes', 'escalate');
  PERFORM pg_temp.ev(t, 'status', 'jorge.medina', n - interval '11 hours', '', '{"name": "Con proveedor"}');
  PERFORM pg_temp.ev(t, 'escalate', 'ricardo.fuentes', n - interval '3 hours', 'El proveedor no responde; se necesita escalar con la dirección.',
    '{}', 'accepted', 'jorge.medina', 'Lo reviso con el proveedor.');
  PERFORM pg_temp.ev(t, 'needs_manager', NULL, n - interval '2 hours');
  PERFORM pg_temp.notify('mariana.ruiz', t, f || ' requiere intervención del Gestor', 'No hay un nivel superior con personas para escalarlo.', n - interval '2 hours', false);
  PERFORM pg_temp.notify('jorge.medina', t, f || ' requiere intervención del Gestor', 'No hay un nivel superior con personas para escalarlo.', n - interval '2 hours', false);

  -- 6. Reabierto después de cerrarse como Resuelto.
  t := pg_temp.ticket('Facturas sin timbrar en la sucursal centro',
    'Las facturas de la sucursal centro se generan sin sello fiscal.',
    'valeria.ortiz', 'media', 'Farmacias del Bajío', NULL, 'asignado', n - interval '4 days',
    n - interval '5 hours', n + interval '7 hours');
  f := 'OD-' || lpad(t::text, 6, '0');
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '4 days', '', jsonb_build_object('to', pg_temp.u('valeria.ortiz')));
  PERFORM pg_temp.ev(t, 'update', 'valeria.ortiz', n - interval '4 days' + interval '2 hours', 'Reinstalaré el certificado de sello digital en la sucursal.',
    jsonb_build_object('due_at', pg_temp.iso(n - interval '3 days')), 'accepted', 'mariana.ruiz');
  PERFORM pg_temp.ev(t, 'close', 'valeria.ortiz', n - interval '3 days', 'Certificado reinstalado; las facturas de prueba salieron timbradas.',
    '{"outcome": "resuelto"}', 'accepted', 'mariana.ruiz');
  PERFORM pg_temp.ev(t, 'reopened', 'mariana.ruiz', n - interval '5 hours', 'El cliente reporta que el problema regresó esta mañana.');
  PERFORM pg_temp.moved(t, 'mariana.ruiz', n - interval '5 hours', 'valeria.ortiz', 'valeria.ortiz', 'reopen');
  PERFORM pg_temp.notify('valeria.ortiz', t, 'Se te asignó el ticket ' || f, 'Facturas sin timbrar en la sucursal centro', n - interval '5 hours', false);

  -- 7. SLA vencido hace un minuto: el worker lo escala automáticamente al siguiente nivel.
  t := pg_temp.ticket('Pantalla en blanco al abrir reportes',
    'Desde la actualización de ayer, la sección de reportes muestra una pantalla en blanco.',
    'camila.reyes', 'alta', 'Grupo Aurora', 'direccion@aurora.test', 'asignado', n - interval '4 hours 1 minute',
    n - interval '4 hours 1 minute', n - interval '1 minute');
  UPDATE tickets_tickets SET sla_warned = true WHERE id = t;
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '4 hours 1 minute', '', jsonb_build_object('to', pg_temp.u('camila.reyes')));

  -- ===== Pendiente de aprobación (una propuesta de cada tipo) ========================================

  -- 8. Actualización con fecha tentativa.
  t := pg_temp.ticket('Error al exportar reportes en PDF',
    'La exportación se queda cargando con reportes de más de 50 páginas.',
    'pablo.ibarra', 'media', 'Constructora Delta', 'compras@delta.test', 'pendiente', n - interval '8 hours',
    n - interval '8 hours', n + interval '15 hours', 'En diagnóstico');
  f := 'OD-' || lpad(t::text, 6, '0');
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '8 hours', '', jsonb_build_object('to', pg_temp.u('pablo.ibarra')));
  PERFORM pg_temp.ev(t, 'status', 'mariana.ruiz', n - interval '7 hours', '', '{"name": "En diagnóstico"}');
  PERFORM pg_temp.ev(t, 'update', 'pablo.ibarra', n - interval '1 hour',
    'Reproduje el error: el servicio de exportación agota la memoria. Aplicaré el ajuste en la ventana de mantenimiento.',
    jsonb_build_object('due_at', pg_temp.iso(n + interval '2 days')), 'pending');
  PERFORM pg_temp.notify('mariana.ruiz', t, 'Pablo Ibarra propone una actualización en ' || f, 'Error al exportar reportes en PDF', n - interval '1 hour', false);
  PERFORM pg_temp.notify('jorge.medina', t, 'Pablo Ibarra propone una actualización en ' || f, 'Error al exportar reportes en PDF', n - interval '1 hour', false);

  -- 9. Escalar.
  t := pg_temp.ticket('Bloqueo de cuentas tras cambio de contraseña',
    'Cinco usuarios quedaron bloqueados después del cambio obligatorio de contraseña.',
    'sofia.navarro', 'alta', 'Colegio Montessori Norte', 'sistemas@montessori.test', 'pendiente', n - interval '5 hours',
    n - interval '5 hours', n + interval '19 hours');
  f := 'OD-' || lpad(t::text, 6, '0');
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '5 hours', '', jsonb_build_object('to', pg_temp.u('sofia.navarro')));
  PERFORM pg_temp.ev(t, 'escalate', 'sofia.navarro', n - interval '30 minutes', 'Requiere permisos de administrador del directorio.', '{}', 'pending');
  PERFORM pg_temp.notify('mariana.ruiz', t, 'Sofía Navarro propone escalar en ' || f, 'Bloqueo de cuentas tras cambio de contraseña', n - interval '30 minutes', false);

  -- 10. Reasignar a un compañero.
  t := pg_temp.ticket('Configuración de impresoras en sucursal sur',
    'Dos impresoras nuevas no aparecen en los equipos de la sucursal sur.',
    'pablo.ibarra', 'baja', 'Papelería Central', 'compras@papeleriacentral.test', 'pendiente', n - interval '3 hours',
    n - interval '3 hours', n + interval '21 hours');
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '3 hours', '', jsonb_build_object('to', pg_temp.u('pablo.ibarra')));
  PERFORM pg_temp.ev(t, 'reassign', 'pablo.ibarra', n - interval '1 hour', 'Sofía atiende la sucursal sur esta semana.',
    jsonb_build_object('user_id', pg_temp.u('sofia.navarro')), 'pending');

  -- 11. Reasignar a otra área.
  t := pg_temp.ticket('No se aplica el descuento por volumen',
    'El sistema no reconoce el descuento por volumen al capturar el pedido.',
    'valeria.ortiz', 'media', 'Abarrotes Don Pepe', 'pedidos@donpepe.test', 'pendiente', n - interval '2 hours',
    n - interval '2 hours', n + interval '10 hours');
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '2 hours', '', jsonb_build_object('to', pg_temp.u('valeria.ortiz')));
  PERFORM pg_temp.ev(t, 'reassign', 'valeria.ortiz', n - interval '40 minutes', 'Es una falla de la regla de precios en el sistema, no de facturación.',
    jsonb_build_object('area_id', (SELECT id FROM areas_areas WHERE name = 'Soporte técnico')), 'pending');

  -- 12. Cerrar (tenía compromiso vigente).
  t := pg_temp.ticket('Usuarios duplicados en el catálogo',
    'El catálogo de usuarios muestra registros duplicados con el mismo correo.',
    'diego.herrera', 'media', 'Laboratorios Vida', 'ti@labvida.test', 'pendiente', n - interval '2 days',
    n - interval '2 days' + interval '3 hours', n + interval '1 day', 'En pruebas');
  UPDATE tickets_tickets SET committed = true WHERE id = t;
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '2 days', '', jsonb_build_object('to', pg_temp.u('diego.herrera')));
  PERFORM pg_temp.ev(t, 'update', 'diego.herrera', n - interval '2 days' + interval '2 hours', 'Depuraré los duplicados y agregaré una validación de correo único.',
    jsonb_build_object('due_at', pg_temp.iso(n + interval '1 day')), 'accepted', 'jorge.medina');
  PERFORM pg_temp.ev(t, 'status', 'jorge.medina', n - interval '1 day', '', '{"name": "En pruebas"}');
  PERFORM pg_temp.ev(t, 'close', 'diego.herrera', n - interval '2 hours', 'Depuré 37 usuarios duplicados y agregué la validación. El cliente confirmó.', '{}', 'pending');

  -- ===== En seguimiento ================================================================================

  -- 13. Compromiso a varios días.
  t := pg_temp.ticket('Cobro duplicado en la factura de septiembre',
    'Aparecen dos cargos por el mismo servicio en la factura de septiembre.',
    'andrea.lozano', 'alta', 'Laura Méndez', 'laura.mendez@correo.test', 'seguimiento', n - interval '1 day',
    n - interval '20 hours', n + interval '3 days', 'Esperando al cliente');
  UPDATE tickets_tickets SET committed = true WHERE id = t;
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '1 day', '', jsonb_build_object('to', pg_temp.u('andrea.lozano')));
  PERFORM pg_temp.ev(t, 'update', 'andrea.lozano', n - interval '22 hours', 'Solicité la nota de crédito a contabilidad; falta la confirmación del cliente.',
    jsonb_build_object('due_at', pg_temp.iso(n + interval '3 days')), 'accepted', 'mariana.ruiz');
  PERFORM pg_temp.ev(t, 'status', 'mariana.ruiz', n - interval '20 hours', '', '{"name": "Esperando al cliente"}');

  -- 14. Compromiso a menos de 24 h (recordatorio enviado).
  t := pg_temp.ticket('Actualización de datos fiscales del cliente',
    'El cliente cambió de domicilio fiscal y necesita sus facturas con los datos nuevos.',
    'ricardo.fuentes', 'media', 'Transportes Medina', 'facturas@tmedina.test', 'seguimiento', n - interval '3 days',
    n - interval '2 days', n + interval '10 hours');
  UPDATE tickets_tickets SET committed = true, reminded = true WHERE id = t;
  f := 'OD-' || lpad(t::text, 6, '0');
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '3 days', '', jsonb_build_object('to', pg_temp.u('ricardo.fuentes')));
  PERFORM pg_temp.ev(t, 'update', 'ricardo.fuentes', n - interval '2 days' - interval '1 hour', 'Actualizaré el padrón y reexpediré las facturas del mes.',
    jsonb_build_object('due_at', pg_temp.iso(n + interval '10 hours')), 'accepted', 'jorge.medina');
  PERFORM pg_temp.notify('ricardo.fuentes', t, 'Tu fecha compromiso de ' || f || ' vence pronto', 'Actualización de datos fiscales del cliente', n - interval '14 hours', false);

  -- 15. Compromiso vencido, tras dos escalamientos.
  t := pg_temp.ticket('Migración de buzones de correo',
    'Migrar 40 buzones al nuevo proveedor de correo sin perder el historial.',
    'laura.campos', 'alta', 'Despacho Herrera y Asociados', 'admin@herreraasoc.test', 'seguimiento', n - interval '5 days',
    n - interval '3 days', n - interval '3 hours', 'Con proveedor');
  UPDATE tickets_tickets SET committed = true, reminded = true, overdue_notified = true WHERE id = t;
  f := 'OD-' || lpad(t::text, 6, '0');
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '5 days', '', jsonb_build_object('to', pg_temp.u('sofia.navarro')));
  PERFORM pg_temp.ev(t, 'escalate', 'sofia.navarro', n - interval '5 days' + interval '3 hours', 'Requiere acceso a la consola del proveedor.', '{}', 'accepted', 'mariana.ruiz');
  PERFORM pg_temp.moved(t, 'mariana.ruiz', n - interval '5 days' + interval '3 hours', 'sofia.navarro', 'diego.herrera', 'escalate');
  PERFORM pg_temp.ev(t, 'escalate', 'diego.herrera', n - interval '4 days', 'Hace falta una decisión de arquitectura sobre los dominios.', '{}', 'accepted', 'mariana.ruiz');
  PERFORM pg_temp.moved(t, 'mariana.ruiz', n - interval '4 days', 'diego.herrera', 'laura.campos', 'escalate');
  PERFORM pg_temp.ev(t, 'update', 'laura.campos', n - interval '3 days' - interval '1 hour', 'Migraré por lotes de 10 buzones durante las noches.',
    jsonb_build_object('due_at', pg_temp.iso(n - interval '3 hours')), 'accepted', 'mariana.ruiz');
  PERFORM pg_temp.ev(t, 'status', 'mariana.ruiz', n - interval '2 days', '', '{"name": "Con proveedor"}');
  PERFORM pg_temp.ev(t, 'commitment_overdue', NULL, n - interval '2 hours');
  PERFORM pg_temp.notify('laura.campos', t, 'Venció la fecha compromiso de ' || f, 'Propón una nueva actualización o el cierre.', n - interval '2 hours', false);
  PERFORM pg_temp.notify('mariana.ruiz', t, 'Venció la fecha compromiso de ' || f, 'Propón una nueva actualización o el cierre.', n - interval '2 hours', false);
  PERFORM pg_temp.notify('jorge.medina', t, 'Venció la fecha compromiso de ' || f, 'Propón una nueva actualización o el cierre.', n - interval '2 hours', true);

  -- 16. Compromiso en Clientes clave.
  t := pg_temp.ticket('Reporte mensual personalizado',
    'El cliente solicita un reporte mensual con el desglose por sucursal.',
    'hector.salinas', 'baja', 'Grupo Aurora', 'direccion@aurora.test', 'seguimiento', n - interval '1 day',
    n - interval '20 hours', n + interval '2 days');
  UPDATE tickets_tickets SET committed = true WHERE id = t;
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '1 day', '', jsonb_build_object('to', pg_temp.u('hector.salinas')));
  PERFORM pg_temp.ev(t, 'update', 'hector.salinas', n - interval '21 hours', 'Prepararé la plantilla y la validaré con el cliente.',
    jsonb_build_object('due_at', pg_temp.iso(n + interval '2 days')), 'accepted', 'jorge.medina', 'Perfecto, mantenme al tanto.');

  -- ===== Cerrado =======================================================================================

  -- 17. Resuelto, encuesta contestada con comentario.
  t := pg_temp.ticket('Alta de usuarios para nueva sucursal', 'Se requieren 12 accesos para la sucursal Monterrey.',
    'camila.reyes', 'baja', 'Grupo Norte', 'ti@norte.test', 'cerrado', n - interval '4 days',
    n - interval '4 days', n - interval '3 days 20 hours');
  UPDATE tickets_tickets SET outcome = 'resuelto', closed_at = n - interval '3 days' WHERE id = t;
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '4 days', '', jsonb_build_object('to', pg_temp.u('camila.reyes')));
  PERFORM pg_temp.ev(t, 'close', 'camila.reyes', n - interval '3 days 2 hours', 'Accesos creados y enviados al responsable de la sucursal.',
    '{"outcome": "resuelto"}', 'accepted', 'mariana.ruiz');
  PERFORM pg_temp.survey(t, n - interval '3 days', 5, 'Muy rápidos y amables. Todo quedó listo el mismo día.', n - interval '2 days 22 hours');

  -- 18. Resuelto, encuesta sin responder.
  t := pg_temp.ticket('Restablecer acceso a la VPN', 'El cliente no puede conectarse a la VPN desde casa.',
    'sofia.navarro', 'media', 'Clínica San Rafael', 'sistemas@sanrafael.test', 'cerrado', n - interval '2 days',
    n - interval '2 days', n - interval '1 day');
  UPDATE tickets_tickets SET outcome = 'resuelto', closed_at = n - interval '1 day' WHERE id = t;
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '2 days', '', jsonb_build_object('to', pg_temp.u('sofia.navarro')));
  PERFORM pg_temp.ev(t, 'close', 'sofia.navarro', n - interval '1 day 1 hour', 'Regeneré el certificado del cliente VPN y probamos la conexión.',
    '{"outcome": "resuelto"}', 'accepted', 'jorge.medina');
  PERFORM pg_temp.survey(t, n - interval '1 day', NULL, NULL, NULL);

  -- 19. Resuelto, encuesta vencida sin respuesta.
  t := pg_temp.ticket('Instalación de certificado SSL', 'El sitio del cliente muestra "conexión no segura".',
    'diego.herrera', 'media', 'Tienda Verde', 'web@tiendaverde.test', 'cerrado', n - interval '11 days',
    n - interval '11 days', n - interval '10 days');
  UPDATE tickets_tickets SET outcome = 'resuelto', closed_at = n - interval '10 days' WHERE id = t;
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '11 days', '', jsonb_build_object('to', pg_temp.u('diego.herrera')));
  PERFORM pg_temp.ev(t, 'close', 'diego.herrera', n - interval '10 days 1 hour', 'Certificado instalado y renovación automática configurada.',
    '{"outcome": "resuelto"}', 'accepted', 'mariana.ruiz');
  PERFORM pg_temp.survey(t, n - interval '10 days', NULL, NULL, NULL);

  -- 20. No resuelto.
  t := pg_temp.ticket('Recuperar archivos borrados del servidor antiguo',
    'El cliente necesita recuperar una carpeta borrada hace seis meses.',
    'laura.campos', 'alta', 'Despacho Herrera y Asociados', 'admin@herreraasoc.test', 'cerrado', n - interval '6 days',
    n - interval '6 days', n - interval '5 days');
  UPDATE tickets_tickets SET outcome = 'no_resuelto', closed_at = n - interval '2 days' WHERE id = t;
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '6 days', '', jsonb_build_object('to', pg_temp.u('laura.campos')));
  PERFORM pg_temp.ev(t, 'close', 'laura.campos', n - interval '2 days 3 hours', 'No existe respaldo de esa fecha; el servidor se formateó en marzo.',
    '{"outcome": "no_resuelto"}', 'accepted', 'mariana.ruiz', 'Se documenta como no resuelto y se informa al cliente.');

  -- 21. Cerrado directamente por el Gestor.
  t := pg_temp.ticket('Solicitud duplicada de alta de proveedor', 'Alta del proveedor "Insumos del Norte" en el sistema.',
    'andrea.lozano', 'baja', NULL, NULL, 'cerrado', n - interval '3 days',
    n - interval '3 days', n - interval '2 days');
  UPDATE tickets_tickets SET outcome = 'no_resuelto', closed_at = n - interval '3 days' + interval '1 hour' WHERE id = t;
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '3 days', '', jsonb_build_object('to', pg_temp.u('andrea.lozano')));
  PERFORM pg_temp.ev(t, 'closed', 'mariana.ruiz', n - interval '3 days' + interval '1 hour', 'Solicitud duplicada; se atiende en otro ticket.',
    '{"outcome": "no_resuelto"}');

  -- 22. Resuelto, encuesta contestada sin comentario.
  t := pg_temp.ticket('Ajuste de horario de facturación', 'Cambiar el corte diario de facturación a las 20:00.',
    'ricardo.fuentes', 'baja', 'Panadería La Espiga', 'contacto@laespiga.test', 'cerrado', n - interval '7 days',
    n - interval '7 days', n - interval '6 days');
  UPDATE tickets_tickets SET outcome = 'resuelto', closed_at = n - interval '6 days' WHERE id = t;
  PERFORM pg_temp.ev(t, 'created', 'mariana.ruiz', n - interval '7 days', '', jsonb_build_object('to', pg_temp.u('ricardo.fuentes')));
  PERFORM pg_temp.ev(t, 'close', 'ricardo.fuentes', n - interval '6 days 2 hours', 'Corte ajustado a las 20:00 y probado con el cierre de ayer.',
    '{"outcome": "resuelto"}', 'accepted', 'jorge.medina');
  PERFORM pg_temp.survey(t, n - interval '6 days', 3, NULL, n - interval '5 days');

  -- ===== Histórico sintético: ~420 tickets cerrados en los últimos 90 días, para la analítica ============
  -- Más carga entre semana y en horario laboral; ~80 % de respuestas dentro del SLA; CSAT sesgado a 4–5.
  PERFORM pg_temp.history(n);
END $$;
