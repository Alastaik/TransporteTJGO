INSERT INTO usuarios (nome, matricula, pin_hash, papel, ativo) 
VALUES ('Administrador', 'admin', '$2a$10$1/b3RHLW1K0eE0I.BQtpdOr6bmmo1hX3WtMwOmZTshfFl6UhREFum', 'admin', true)
ON CONFLICT (matricula) DO UPDATE 
SET pin_hash = EXCLUDED.pin_hash, papel = 'admin';
