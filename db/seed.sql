-- Seed idempotente: 6 imóveis iniciais + corretor admin.
insert into imoveis (id, titulo, bairro, cidade, preco, area, quartos, vagas, tipo, foto, diferenciais)
values
 ('11111111-1111-1111-1111-111111111101','Cobertura Panorâmica Itaim','Itaim Bibi','São Paulo',8900000,420,4,5,'apartamento','/imoveis/imovel-1.jpg', array['Vista 360° da cidade','Pé-direito duplo','Automação completa']),
 ('11111111-1111-1111-1111-111111111102','Casa Contemporânea com Piscina','Alphaville','Barueri',6400000,580,5,6,'casa','/imoveis/imovel-2.jpg', array['Piscina raia aquecida','Condomínio fechado','Home theater']),
 ('11111111-1111-1111-1111-111111111103','Apartamento Jardins Assinado','Jardins','São Paulo',4250000,210,3,3,'apartamento','/imoveis/imovel-3.jpg', array['Projeto de interiores incluso','Varanda gourmet','Andar alto']),
 ('11111111-1111-1111-1111-111111111104','Duplex Frente Mar','Riviera','Bertioga',5100000,260,4,4,'apartamento','/imoveis/imovel-4.jpg', array['Frente mar total','Terraço com spa','Mobiliado']),
 ('11111111-1111-1111-1111-111111111105','Laje Corporativa Faria Lima','Pinheiros','São Paulo',12500000,900,0,18,'comercial','/imoveis/imovel-5.jpg', array['Certificação LEED','Lobby em mármore','Alta liquidez']),
 ('11111111-1111-1111-1111-111111111106','Terreno em Condomínio de Montanha','Vale das Videiras','Petrópolis',2300000,3200,0,0,'terreno','/imoveis/imovel-6.jpg', array['Vista para o vale','Nascente própria','Projeto aprovado'])
on conflict (id) do nothing;
