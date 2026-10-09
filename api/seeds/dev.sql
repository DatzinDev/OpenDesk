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

-- Tickets de ejemplo en distintos estados; solo se cargan si aún no hay tickets.
DO $$
DECLARE
  g int := (SELECT id FROM users_users WHERE email = 'mariana.ruiz@opendesk.test');
  t int;
  u int;
BEGIN
  IF EXISTS (SELECT 1 FROM tickets_tickets) THEN RETURN; END IF;

  u := (SELECT id FROM users_users WHERE email = 'sofia.navarro@opendesk.test');
  INSERT INTO tickets_tickets (title, description, area_id, assignee_id, priority, client_name, client_email, due_from, due_at, created_by)
  VALUES ('No puedo iniciar sesión en el portal', 'El cliente indica que el portal rechaza su contraseña desde ayer.',
          (SELECT area_id FROM users_users WHERE id = u), u, 'alta', 'Grupo Andrade', 'compras@andrade.test', now(), now() + interval '20 hours', g)
  RETURNING id INTO t;
  INSERT INTO tickets_events (ticket_id, kind, actor_id, data) VALUES (t, 'created', g, json_build_object('to', u));

  u := (SELECT id FROM users_users WHERE email = 'pablo.ibarra@opendesk.test');
  INSERT INTO tickets_tickets (title, description, area_id, assignee_id, priority, status, due_from, due_at, created_by)
  VALUES ('Error al exportar reportes en PDF', 'La exportación se queda cargando con reportes de más de 50 páginas.',
          (SELECT area_id FROM users_users WHERE id = u), u, 'media', 'pendiente', now() - interval '6 hours', now() + interval '6 hours', g)
  RETURNING id INTO t;
  INSERT INTO tickets_events (ticket_id, kind, actor_id, data) VALUES (t, 'created', g, json_build_object('to', u));
  INSERT INTO tickets_events (ticket_id, kind, actor_id, comment, data, state)
  VALUES (t, 'update', u, 'Reproduje el error; el servicio de exportación agota la memoria. Aplicaré el ajuste en la siguiente ventana.',
          json_build_object('due_at', to_char((now() + interval '2 days') AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS+00:00')), 'pending');

  u := (SELECT id FROM users_users WHERE email = 'andrea.lozano@opendesk.test');
  INSERT INTO tickets_tickets (title, description, area_id, assignee_id, priority, status, committed, client_name, due_from, due_at, created_by)
  VALUES ('Cobro duplicado en la factura de septiembre', 'Aparecen dos cargos por el mismo servicio.',
          (SELECT area_id FROM users_users WHERE id = u), u, 'alta', 'seguimiento', true, 'Laura Méndez', now() - interval '1 day', now() + interval '3 days', g)
  RETURNING id INTO t;
  INSERT INTO tickets_events (ticket_id, kind, actor_id, data) VALUES (t, 'created', g, json_build_object('to', u));
  INSERT INTO tickets_events (ticket_id, kind, actor_id, comment, data, state, decided_by)
  VALUES (t, 'update', u, 'Solicité la nota de crédito a contabilidad.',
          json_build_object('due_at', to_char((now() + interval '3 days') AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS+00:00')), 'accepted', g);

  u := (SELECT id FROM users_users WHERE email = 'diego.herrera@opendesk.test');
  INSERT INTO tickets_tickets (title, description, area_id, assignee_id, priority, due_from, due_at, created_by)
  VALUES ('Integración con el ERP sin sincronizar', 'Los pedidos no llegan al ERP desde el lunes.',
          (SELECT area_id FROM users_users WHERE id = u), u, 'media', now() - interval '30 hours', now() - interval '2 hours', g)
  RETURNING id INTO t;
  INSERT INTO tickets_events (ticket_id, kind, actor_id, data) VALUES (t, 'created', g, json_build_object('to', u));

  u := (SELECT id FROM users_users WHERE email = 'camila.reyes@opendesk.test');
  INSERT INTO tickets_tickets (title, description, area_id, assignee_id, priority, status, outcome, closed_at, client_email, due_from, due_at, created_by)
  VALUES ('Alta de usuarios para nueva sucursal', 'Se requieren 12 accesos para la sucursal Monterrey.',
          (SELECT area_id FROM users_users WHERE id = u), u, 'baja', 'cerrado', 'resuelto', now() - interval '1 day', 'ti@norte.test',
          now() - interval '3 days', now() - interval '2 days', g)
  RETURNING id INTO t;
  INSERT INTO tickets_events (ticket_id, kind, actor_id, data) VALUES (t, 'created', g, json_build_object('to', u));
  INSERT INTO tickets_events (ticket_id, kind, actor_id, comment, data, state, decided_by)
  VALUES (t, 'close', u, 'Accesos creados y enviados al responsable de la sucursal.', '{"outcome": "resuelto"}', 'accepted', g);

  u := (SELECT id FROM users_users WHERE email = 'valeria.ortiz@opendesk.test');
  INSERT INTO tickets_tickets (title, description, area_id, assignee_id, priority, status, due_from, due_at, created_by)
  VALUES ('No se aplica el descuento por volumen', 'El sistema no reconoce el descuento al capturar el pedido.',
          (SELECT area_id FROM users_users WHERE id = u), u, 'media', 'pendiente', now() - interval '2 hours', now() + interval '10 hours', g)
  RETURNING id INTO t;
  INSERT INTO tickets_events (ticket_id, kind, actor_id, data) VALUES (t, 'created', g, json_build_object('to', u));
  INSERT INTO tickets_events (ticket_id, kind, actor_id, comment, data, state)
  VALUES (t, 'reassign', u, 'Es una falla de la regla de precios en el sistema, no de facturación.',
          json_build_object('area_id', (SELECT id FROM areas_areas WHERE name = 'Soporte técnico')), 'pending');
END $$;

-- Encuesta contestada para el ticket cerrado de ejemplo (token ficticio: no hay enlace válido).
INSERT INTO surveys_surveys (ticket_id, email, token_hash, sent_at, expires_at, rating, comment, answered_at)
SELECT t.id, t.client_email, md5(random()::text) || md5(random()::text), t.closed_at, t.closed_at + interval '7 days',
       4, 'Rápidos y amables; tardaron un poco en confirmar los accesos.', t.closed_at + interval '3 hours'
FROM tickets_tickets t
WHERE t.title = 'Alta de usuarios para nueva sucursal'
  AND NOT EXISTS (SELECT 1 FROM surveys_surveys s WHERE s.ticket_id = t.id);
