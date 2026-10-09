-- Datos ficticios para pruebas (DEV_SEED=true). Idempotente: se puede ejecutar en cada arranque.
-- Los correos @opendesk.test no pueden iniciar sesión con Google; sirven para probar asignaciones y la matriz.

INSERT INTO areas_areas (name, description, sla_hours, always_open, week, pause_on_holidays) VALUES
  ('Soporte técnico', 'Fallas de producto, accesos e incidencias técnicas.', 24, false,
   '[["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],null,null]', true),
  ('Facturación', 'Aclaraciones de cobros, facturas y reembolsos.', 12, false,
   '[["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],["09:00","14:00"],null]', true),
  ('Clientes clave', 'Atención prioritaria a cuentas estratégicas.', 4, true,
   '[["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],["09:00","18:00"],null,null]', false)
ON CONFLICT (name) DO NOTHING;

INSERT INTO users_users (email, name, role, area_id) VALUES
  ('mariana.ruiz@opendesk.test',   'Mariana Ruiz',    'gestor',  NULL),
  ('jorge.medina@opendesk.test',   'Jorge Medina',    'gestor',  NULL),
  ('laura.campos@opendesk.test',   'Laura Campos',    'usuario', (SELECT id FROM areas_areas WHERE name = 'Soporte técnico')),
  ('diego.herrera@opendesk.test',  'Diego Herrera',   'usuario', (SELECT id FROM areas_areas WHERE name = 'Soporte técnico')),
  ('sofia.navarro@opendesk.test',  'Sofía Navarro',   'usuario', (SELECT id FROM areas_areas WHERE name = 'Soporte técnico')),
  ('pablo.ibarra@opendesk.test',   'Pablo Ibarra',    'usuario', (SELECT id FROM areas_areas WHERE name = 'Soporte técnico')),
  ('andrea.lozano@opendesk.test',  'Andrea Lozano',   'usuario', (SELECT id FROM areas_areas WHERE name = 'Facturación')),
  ('ricardo.fuentes@opendesk.test','Ricardo Fuentes', 'usuario', (SELECT id FROM areas_areas WHERE name = 'Facturación')),
  ('valeria.ortiz@opendesk.test',  'Valeria Ortiz',   'usuario', (SELECT id FROM areas_areas WHERE name = 'Facturación')),
  ('hector.salinas@opendesk.test', 'Héctor Salinas',  'usuario', (SELECT id FROM areas_areas WHERE name = 'Clientes clave')),
  ('camila.reyes@opendesk.test',   'Camila Reyes',    'usuario', (SELECT id FROM areas_areas WHERE name = 'Clientes clave')),
  ('tomas.aguirre@opendesk.test',  'Tomás Aguirre',   'usuario', NULL)
ON CONFLICT (email) DO NOTHING;

-- Matriz de escalamiento: Soporte con dos niveles; Facturación con un responsable; Clientes clave sin matriz.
UPDATE users_users u SET manager_id = m.id
FROM (VALUES
  ('diego.herrera@opendesk.test', 'laura.campos@opendesk.test'),
  ('sofia.navarro@opendesk.test', 'diego.herrera@opendesk.test'),
  ('pablo.ibarra@opendesk.test',  'diego.herrera@opendesk.test'),
  ('andrea.lozano@opendesk.test', 'ricardo.fuentes@opendesk.test'),
  ('valeria.ortiz@opendesk.test', 'ricardo.fuentes@opendesk.test')
) AS pair(email, manager_email)
JOIN users_users m ON m.email = pair.manager_email
WHERE u.email = pair.email AND u.manager_id IS NULL;

INSERT INTO areas_holidays (day, name) VALUES
  ('2026-11-16', 'Día de la Revolución'),
  ('2026-12-25', 'Navidad'),
  ('2027-01-01', 'Año Nuevo'),
  ('2027-02-01', 'Día de la Constitución')
ON CONFLICT (day) DO NOTHING;
