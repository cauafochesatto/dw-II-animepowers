-- Anime Powers Database Schema
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    avatar TEXT,
    role VARCHAR(50) DEFAULT 'Guerreiro',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS powers (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    elemento VARCHAR(50) NOT NULL,
    dano INTEGER NOT NULL,
    alcance VARCHAR(50) NOT NULL,
    custo INTEGER NOT NULL,
    personagem VARCHAR(100) NOT NULL,
    anime VARCHAR(100) NOT NULL,
    descricao TEXT,
    imagem TEXT
);

INSERT INTO users (id, name, email, password, avatar, role) VALUES
('user_1', 'Guerreiro Supremo', 'otaku@animepowers.com', 'password123', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=200&auto=format&fit=crop&q=80', 'Guerreiro Rank SSS'),
('user_2', 'Caçador de Poderes', 'exemplo@gmail.com', '123', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=200&auto=format&fit=crop&q=80', 'Shinobi Especial')
ON CONFLICT (id) DO NOTHING;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (1, 'Rasengan', 'Ninjutsu', 'Vento', 85, 'Curto', 40, 'Naruto Uzumaki', 'Naruto', 'Esfera espiral de chakra puro em alta rotação. Causa dano cinético concentrado à queima-roupa.', '/imagenspoderes/rasengan.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (2, 'Chidori', 'Ninjutsu', 'Trovão', 88, 'Curto', 42, 'Kakashi Hatake', 'Naruto', 'Lâmina perfurante de relâmpagos concentrados na mão. Ressoa com o som de mil pássaros cortando o ar.', '/imagenspoderes/chidori.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (3, 'Gomu Gomu no Gatling', 'Akuma no Mi', 'Físico', 90, 'Médio', 35, 'Monkey D. Luffy', 'One Piece', 'Chuva ininterrupta de socos elásticos hiper-acelerados que parecem dezenas de braços simultâneos.', '/imagenspoderes/gomugomunogatling.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (4, 'Entei (Grande Imperador das Chamas)', 'Akuma no Mi', 'Fogo', 94, 'Médio', 48, 'Portgas D. Ace', 'One Piece', 'Esfera colossal de fogo criada a partir da Mera Mera no Mi que simula um sol miniatura caindo no campo.', '/imagenspoderes/entei.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (5, 'Kamehameha', 'Ki', 'Energia', 95, 'Longo', 50, 'Son Goku', 'Dragon Ball', 'Feixe monumental de Ki concentrado disparado das palmas das mãos, capaz de perfurar montanhas e planetas.', '/imagenspoderes/kamehamenha.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (6, 'Final Flash', 'Ki', 'Energia', 97, 'Longo', 60, 'Vegeta', 'Dragon Ball', 'Técnica suprema do Príncipe dos Saiyajins. Carrega toda a sua fúria e orgulho em um canhão dourado avassalador.', '/imagenspoderes/finalflash.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (7, 'Jajanken: Rock', 'Nen', 'Terra', 80, 'Curto', 30, 'Gon Freecss', 'Hunter x Hunter', 'Aura de Nen concentrada no punho através de Reforço com carga lenta e impacto sísmico devastador.', '/imagenspoderes/jajaken.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (8, 'Bungee Gum', 'Nen', 'Físico', 55, 'Médio', 25, 'Hisoka Morow', 'Hunter x Hunter', 'Possui propriedades tanto de borracha quanto de chiclete. Altamente elástica, gruda e controla os oponentes.', '/imagenspoderes/bungeegum.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (9, 'Hinokami Kagura (Dança do Deus do Fogo)', 'Respiração', 'Fogo', 92, 'Curto', 45, 'Tanjiro Kamado', 'Demon Slayer', 'Dança ancestral da Respiração Solar. Transforma o fôlego em lâminas cintilantes de chamas eternas.', '/imagenspoderes/kagura.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (10, 'Respiração da Água: 10ª Forma', 'Respiração', 'Água', 78, 'Médio', 32, 'Giyu Tomioka', 'Demon Slayer', 'Fluxo constante em forma de dragão aquático. O poder e a inércia dos golpes aumentam a cada giro corporal.', '/imagenspoderes/respiracaoagua.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (11, 'Star Platinum: Ora Ora', 'Stand', 'Físico', 93, 'Curto', 38, 'Jotaro Kujo', 'JoJo''s Bizarre Adventure', 'Sequência de socos supersônicos com precisão microscópica desferidos pelo Stand mais implacável do mundo.', '/imagenspoderes/oraora.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (12, 'Za Warudo (O Mundo)', 'Stand', 'Tempo', 99, 'Curto', 70, 'DIO', 'JoJo''s Bizarre Adventure', 'Interrompe o fluxo do próprio tempo por segundos sagrados, tornando o usuário invulnerável e onipresente.', '/imagenspoderes/zawarudo.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (13, 'Getsuga Tensho', 'Reiatsu', 'Energia', 89, 'Longo', 44, 'Ichigo Kurosaki', 'Bleach', 'Condensa o poder espiritual na ponta da lâmina Zangetsu e o dispara em forma de crescente de energia voraz.', '/imagenspoderes/Getsuga.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (14, 'Bankai: Senbonzakura Kageyoshi', 'Reiatsu', 'Vento', 91, 'Longo', 55, 'Byakuya Kuchiki', 'Bleach', 'Milhões de lâminas microscópicas que refletem a luz como pétalas de cerejeira em uma tempestade letal.', '/imagenspoderes/senbonzaukura.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (15, 'Lumos Maxima Arcano', 'Feitiço', 'Luz', 35, 'Médio', 14, 'Frieren', 'Frieren: Beyond Journey''s End', 'Clarão mágico puro que cega inimigos, purifica magias sombrias e dissipa qualquer névoa ou ilusão de campo.', '/imagenspoderes/frieren.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (16, 'Expansão de Domínio: Santuário Malevolente', 'Feitiço', 'Sombra', 99, 'Médio', 68, 'Ryomen Sukuna', 'Jujutsu Kaisen', 'Cria um domínio aberto onde lâminas invisíveis cortam incansavelmente tudo o que possui e não possui energia amaldiçoada.', '/imagenspoderes/sukunasantuario.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (17, 'Infinito & Vazio Ilimitado', 'Feitiço', 'Espaço', 88, 'Longo', 65, 'Satoru Gojo', 'Jujutsu Kaisen', 'Inunda o cérebro do oponente com toda a informação infinita do cosmos, paralisando corpo e alma completamente.', '/imagenspoderes/vazioilimitado.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (18, '100% United States of Smash', 'Individualidade', 'Físico', 98, 'Curto', 62, 'All Might', 'My Hero Academia', 'Toda a herança de gerações do One For All canalizada em um soco colossal que altera a pressão atmosférica e clima.', '/imagenspoderes/smash.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (19, 'Amaterasu (Chamas Negras)', 'Ninjutsu', 'Fogo', 95, 'Médio', 52, 'Sasuke Uchiha', 'Naruto', 'Chamas negras inextinguíveis liberadas pelo Mangekyo Sharingan que ardem por sete dias e sete noites.', '/imagenspoderes/Amaterasu.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (20, 'Shinra Tensei (Julgamento Divino)', 'Ninjutsu', 'Espaço', 96, 'Longo', 64, 'Pain (Nagato)', 'Naruto', 'Manipulação gravitacional suprema pelo Rinnegan capaz de varrer aldeias inteiras em uma única onda de repulsão.', '/imagenspoderes/Shinra Tensei.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (21, 'Kamui (Vórtice Dimensional)', 'Ninjutsu', 'Espaço', 86, 'Longo', 46, 'Obito Uchiha', 'Naruto', 'Torce o espaço-tempo para sugar alvos e o próprio corpo para outra dimensão inacessível com intangibilidade.', '/imagenspoderes/kamui.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (22, 'Gear 5: Bajrang Gun', 'Akuma no Mi', 'Físico', 100, 'Longo', 75, 'Monkey D. Luffy', 'One Piece', 'Despertar do Guerreiro da Libertação Sun God Nika. Punho gigante do tamanho de uma ilha revestido de Haki do Rei.', '/imagenspoderes/bajranggun.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (23, 'Santoryu Ougi: Asura', 'Akuma no Mi', 'Vento', 92, 'Curto', 45, 'Roronoa Zoro', 'One Piece', 'Manifestação espiritual de nove espadas através da pura força de vontade e aura demoníaca do espadachim.', '/imagenspoderes/santoryu.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (24, 'Ope Ope: Room & Shambles', 'Akuma no Mi', 'Espaço', 84, 'Longo', 42, 'Trafalgar D. Water Law', 'One Piece', 'Cria um território cirúrgico onde matéria, corpos e ataques podem ser desmembrados e teletransportados à vontade.', '/imagenspoderes/opeope.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (25, 'Diable Jambe: Flambage Shot', 'Akuma no Mi', 'Fogo', 87, 'Curto', 36, 'Vinsmoke Sanji', 'One Piece', 'Atrito em velocidade extrema que incendeia as pernas com chamas incandescentes prontas para estilhaçar defesas.', '/imagenspoderes/diablejambe.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (26, 'Super Genki Dama Cósmica', 'Ki', 'Energia', 99, 'Global', 80, 'Son Goku', 'Dragon Ball', 'Reúne a energia vital de todos os seres vivos do universo em uma esfera de bondade capaz de obliterar o mal.', '/imagenspoderes/genkidama.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (27, 'Hakai (Destruição Suprema)', 'Ki', 'Energia', 100, 'Curto', 85, 'Bills (Lord Beerus)', 'Dragon Ball', 'Poder sagrado dos Deuses da Destruição. Apaga completamente alvos físicos e espirituais do tecido da existência.', '/imagenspoderes/hakai.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (28, 'Instinto Superior (Ultra Instinct)', 'Ki', 'Luz', 96, 'Curto', 55, 'Son Goku', 'Dragon Ball', 'O corpo reage autonomamente a qualquer perigo e contra-ataca em milissegundos sem necessidade de pensamento consciente.', '/imagenspoderes/instintosuperior.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (29, 'Makankosappo (Canhão de Feixe Especial)', 'Ki', 'Energia', 91, 'Longo', 48, 'Piccolo', 'Dragon Ball', 'Dois dedos concentram Ki em espiral perfurante capaz de transpassar até mesmo as armaduras mais resistentes.', '/imagenspoderes/makankasappo.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (30, 'Kanmuru (Godspeed)', 'Nen', 'Trovão', 89, 'Curto', 42, 'Killua Zoldyck', 'Hunter x Hunter', 'Transmuta a aura em impulsos elétricos nervosos diretos aos músculos, alcançando reflexos que ultrapassam a biologia humana.', '/imagenspoderes/kanmuru.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (31, 'Hyakushiki Kannon (Bodhisattva Guanyin)', 'Nen', 'Luz', 97, 'Médio', 65, 'Isaac Netero', 'Hunter x Hunter', 'Estátua titânica de cem mãos nascida de décadas de orações silenciosas. Desfere tapas que esmagam o próprio som.', '/imagenspoderes/netero.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (32, 'Respiração do Trovão: 1ª Forma (Hekireki Issen)', 'Respiração', 'Trovão', 90, 'Curto', 34, 'Zenitsu Agatsuma', 'Demon Slayer', 'Avanço cegante em velocidade do relâmpago com desembainhar e corte perfeito num único piscar de olhos.', '/imagenspoderes/zenitsu.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (33, 'Respiração da Névoa: 7ª Forma (Neblina Oculta)', 'Respiração', 'Vento', 85, 'Médio', 36, 'Muichiro Tokito', 'Demon Slayer', 'Alterna ritmos lentos e velocidades supersônicas, desorientando a visão do adversário como névoa densa.', '/imagenspoderes/kagura.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (34, 'King Crimson & Epitaph', 'Stand', 'Tempo', 94, 'Curto', 58, 'Diavolo', 'JoJo''s Bizarre Adventure', 'Apaga até 10 segundos do tempo enquanto prevê o futuro imediato, deixando apenas as consequências a seu favor.', '/imagenspoderes/zawarudo.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (35, 'Gold Experience Requiem', 'Stand', 'Tempo', 99, 'Global', 78, 'Giorno Giovanna', 'JoJo''s Bizarre Adventure', 'Retorna qualquer ataque, vontade ou causalidade ao ponto zero, prendendo inimigos em um ciclo infinito de fim nulo.', '/imagenspoderes/Goldexperience.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (36, 'Mugetsu: Getsuga Tensho Final', 'Reiatsu', 'Sombra', 100, 'Médio', 88, 'Ichigo Kurosaki', 'Bleach', 'Ao se fundir com o próprio Getsuga, o usuário se torna uma lâmina viva de escuridão absoluta que rasga a dimensão.', '/imagenspoderes/mugetsufinal.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (37, 'Kyoka Suigetsu (Hipnose Completa)', 'Reiatsu', 'Espaço', 85, 'Global', 50, 'Sosuke Aizen', 'Bleach', 'Controla os cinco sentidos de quem testemunha o ritual de liberação, tecendo ilusões indistinguíveis da realidade.', '/imagenspoderes/kyoka.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (38, 'Vazio Roxo (Murasaki)', 'Feitiço', 'Espaço', 98, 'Longo', 66, 'Satoru Gojo', 'Jujutsu Kaisen', 'Colide a atração do Azul com a repulsão do Vermelho, gerando uma singularidade imaginária que apaga matéria por onde passa.', '/imagenspoderes/vazioroxo.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (39, 'Fúria Negra (Black Flash)', 'Feitiço', 'Trovão', 93, 'Curto', 38, 'Yuji Itadori', 'Jujutsu Kaisen', 'Distorção espacial que ocorre quando a energia amaldiçoada é aplicada em 0.000001 segundos após o impacto físico, elevando o golpe à potência de 2.5.', '/imagenspoderes/furianegra.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (40, 'Prominence Burn', 'Individualidade', 'Fogo', 95, 'Longo', 60, 'Endeavor', 'My Hero Academia', 'Feixe térmico contínuo em temperatura nuclear que vaporiza tecidos e regenerações monstruosas instantaneamente.', '/imagenspoderes/prominennce.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (41, 'Decay (Desintegração Instantânea)', 'Individualidade', 'Sombra', 97, 'Médio', 54, 'Tomura Shigaraki', 'My Hero Academia', 'Tudo o que os cinco dedos tocam se desfaz em pó em reação em cadeia que se espalha por quarteirões inteiros.', '/imagenspoderes/decay.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (42, 'Rugido do Titã de Ataque & Fundador', 'Titã', 'Físico', 94, 'Longo', 56, 'Eren Yeager', 'Attack on Titan', 'Comanda as vontades através dos Caminhos e liberta fúria titânica incontrolável na busca incessante pela liberdade.', '/imagenspoderes/titafundador.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (43, 'Explosão Térmica do Titã Colossal', 'Titã', 'Fogo', 99, 'Global', 72, 'Armin Arlert', 'Attack on Titan', 'Transformação titânica equivalente a uma detonação tática de vapor e fogo com raio de aniquilação colossal.', '/imagenspoderes/titacolossal.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (44, 'Arise (Ergam-se - Exército das Sombras)', 'Sombra', 'Sombra', 98, 'Global', 68, 'Sung Jin-woo', 'Solo Leveling', 'Extrai as almas de guerreiros e monstros caídos em batalha, transformando-os em um exército imortal leal ao Monarca das Sombras.', '/imagenspoderes/arise.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (45, 'Autoridade do Governante', 'Sombra', 'Espaço', 90, 'Longo', 44, 'Sung Jin-woo', 'Solo Leveling', 'Telecinese invisível primordial que arremessa inimigos, projéteis e estruturas pesadas pelo campo sem tocar em nada.', '/imagenspoderes/autoridadedogovernante.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (46, 'Corte Dimensional: Equinócio', 'Anti-Magia', 'Sombra', 96, 'Longo', 55, 'Yami Sukehiro', 'Black Clover', 'Imbui a katana com Magia da Escuridão reforçada para fender literalmente as dimensões e o próprio espaço.', '/imagenspoderes/cortedimensional.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (47, 'Espada Anti-Magia: Demon-Slayer', 'Anti-Magia', 'Físico', 89, 'Curto', 30, 'Asta', 'Black Clover', 'Espada negra sem mana capaz de cortar, rebater e anular qualquer feitiço cósmico ou elemental com força bruta.', '/imagenspoderes/antimagia.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (48, 'Alquimia das Chamas', 'Alquimia', 'Fogo', 91, 'Médio', 42, 'Roy Mustang', 'Fullmetal Alchemist: Brotherhood', 'Estalar de dedos com luvas de ignição que ajusta a densidade de oxigênio no ar e guia explosões milimétricas precisas.', '/imagenspoderes/alquimiadaschamas.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (49, 'Transmutação sem Círculo', 'Alquimia', 'Terra', 84, 'Curto', 28, 'Edward Elric', 'Fullmetal Alchemist: Brotherhood', 'Bater de palmas que acessa a Verdade do Portão, transmutando matéria sólida instantaneamente em lâminas, canhões e lanças.', '/imagenspoderes/semcirculo.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (50, 'Soco Sério (Serious Punch)', 'Individualidade', 'Físico', 100, 'Global', 90, 'Saitama', 'One Punch Man', 'Um soco direto com seriedade que parte nuvens em escala continental e anula ataques capazes de destruir estrelas.', '/imagenspoderes/seriouspunch.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (51, 'Punho da Água Esmagadora de Rocha', 'Nen', 'Água', 88, 'Curto', 34, 'Bang (Silver Fang)', 'One Punch Man', 'Arte marcial defensiva suprema que desvia golpes inimigos com a suavidade da água e contra-ataca com a dureza da pedra.', '/imagenspoderes/punhodeagua.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (52, 'Explosão Psíquica 100% Hostilidade', 'Feitiço', 'Energia', 97, 'Longo', 62, 'Shigeo Kageyama (Mob)', 'Mob Psycho 100', 'Quando a contenção emocional colapsa, liberta telecinese colossal capaz de reconstruir ou despedaçar cidades inteiras.', '/imagenspoderes/explosaopsiquica.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (53, 'Zoltraak (Magia de Destruição de Demônios)', 'Feitiço', 'Luz', 93, 'Longo', 46, 'Frieren', 'Frieren: Beyond Journey''s End', 'Feixe perfurante de mana concentrada desenvolvido especificamente para penetrar defesas mágicas e aniquilar o núcleo demoníaco.', '/imagenspoderes/zoltraak.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
INSERT INTO powers (id, nome, categoria, elemento, dano, alcance, custo, personagem, anime, descricao, imagem)
VALUES (54, 'Chainsaw Devourer (Motosserra do Diabo)', 'Individualidade', 'Físico', 95, 'Curto', 48, 'Denji / Pochita', 'Chainsaw Man', 'Lâminas de motosserra brotam da cabeça e membros com sede insaciável de sangue e poder para devorar conceitos da história.', '/imagenspoderes/chainsaw.jpg')
ON CONFLICT (id) DO UPDATE SET
  nome = EXCLUDED.nome,
  categoria = EXCLUDED.categoria,
  elemento = EXCLUDED.elemento,
  dano = EXCLUDED.dano,
  alcance = EXCLUDED.alcance,
  custo = EXCLUDED.custo,
  personagem = EXCLUDED.personagem,
  anime = EXCLUDED.anime,
  descricao = EXCLUDED.descricao,
  imagem = EXCLUDED.imagem;
SELECT setval(pg_get_serial_sequence('powers', 'id'), COALESCE((SELECT MAX(id) + 1 FROM powers), 1), false);
