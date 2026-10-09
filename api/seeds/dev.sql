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
