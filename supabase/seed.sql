-- Execute after schema + migrations.
-- Mirrors src/fullmigration.sql
begin;

insert into public.usina (
  id, created_date, updated_date, created_by,
  nome, cnpj, preco_kwh, desconto_percentual,
  capacidade_disponivel_kwh,
  contato_nome, contato_email, contato_telefone,
  status
) values
  ('6980da91afa20bf3969a64b6','2026-02-02 17:10:41+00','2026-02-02 17:10:41+00','juarezsilveirajunior@gmail.com','Solar Norte Energia','12.345.678/0001-90',0.52,18.0,150000.0,'Carlos Silva','carlos@solarnorte.com.br','(31) 99999-1234','ativa'),
  ('6980da91afa20bf3969a64b7','2026-02-02 17:10:41+00','2026-02-02 17:10:41+00','juarezsilveirajunior@gmail.com','Usina Sol Nascente','98.765.432/0001-10',0.48,22.0,80000.0,'Ana Paula','ana@solnascente.com.br','(31) 98888-5678','ativa'),
  ('6980da91afa20bf3969a64b8','2026-02-02 17:10:41+00','2026-02-02 17:10:41+00','juarezsilveirajunior@gmail.com','Green Power MG','45.678.901/0001-23',0.55,15.0,200000.0,'Roberto Mendes','roberto@greenpower.com.br','(19) 97777-9999','ativa')
on conflict (id) do nothing;

commit;

