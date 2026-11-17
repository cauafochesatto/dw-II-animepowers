/**
 * Catálogo de atributos oficiais dos personagens (somente dados de combate).
 * Espelho autorizado dos valores de src/data/characters.js para validação server-side.
 * Qualquer stat enviado pelo cliente acima destes valores é forjado.
 *
 * IMPORTANTE: se um personagem novo for adicionado ao frontend, adicionar aqui também.
 */

export const CHARACTERS = [
  { id: 'sukuna', nome: 'Ryomen Sukuna', forca: 96, velocidade: 94, defesa: 92, resistencia: 95, energia: 98, poderEspecial: 99, imagem: '/poderesanime/imagenspoderes/sukunasantuario.jpg', habilidadeEspecial: 'Santuário Malevolente (Fukuma Mizushi)' },
  { id: 'saitama', nome: 'Saitama', forca: 99, velocidade: 96, defesa: 97, resistencia: 99, energia: 91, poderEspecial: 98, imagem: '/poderesanime/imagenspoderes/seriouspunch.jpg', habilidadeEspecial: 'Soco Sério Multidimensional' },
  { id: 'beerus', nome: 'Bills (Lord Beerus)', forca: 97, velocidade: 96, defesa: 94, resistencia: 96, energia: 99, poderEspecial: 99, imagem: '/poderesanime/imagenspoderes/hakai.jpg', habilidadeEspecial: 'Hakai (Aniquilação Cósmica)' },
  { id: 'giorno', nome: 'Giorno Giovanna', forca: 90, velocidade: 95, defesa: 99, resistencia: 93, energia: 97, poderEspecial: 99, imagem: '/poderesanime/imagenspoderes/goldexperience.jpg', habilidadeEspecial: 'Gold Experience Requiem (Retorno ao Zero)' },
  { id: 'goku', nome: 'Son Goku', forca: 98, velocidade: 92, defesa: 88, resistencia: 93, energia: 95, poderEspecial: 96, imagem: '/poderesanime/imagenspoderes/kamehamenha.jpg', habilidadeEspecial: 'Kamehameha Divino com Instinto Superior' },
  { id: 'gojo', nome: 'Satoru Gojo', forca: 89, velocidade: 95, defesa: 95, resistencia: 91, energia: 96, poderEspecial: 97, imagem: '/poderesanime/imagenspoderes/vazioilimitado.jpg', habilidadeEspecial: 'Infinito Intocável & Vazio Ilimitado' },
  { id: 'minato', nome: 'Minato Namikaze', forca: 87, velocidade: 97, defesa: 86, resistencia: 88, energia: 93, poderEspecial: 94, imagem: '/poderesanime/imagenspoderes/minato.jpg', habilidadeEspecial: 'Deus Voador do Trovão (Hiraishin no Jutsu)' },
  { id: 'escanor', nome: 'Escanor', forca: 97, velocidade: 84, defesa: 93, resistencia: 94, energia: 91, poderEspecial: 95, imagem: '/poderesanime/imagenspoderes/escanor.jpg', habilidadeEspecial: 'Cruel Sun & The One' },
  { id: 'netero', nome: 'Isaac Netero', forca: 93, velocidade: 96, defesa: 91, resistencia: 93, energia: 95, poderEspecial: 95, imagem: '/poderesanime/imagenspoderes/netero.jpg', habilidadeEspecial: 'Bodhisattva Guanyin das 100 Mãos' },
  { id: 'aizen', nome: 'Sosuke Aizen', forca: 92, velocidade: 94, defesa: 91, resistencia: 92, energia: 98, poderEspecial: 97, imagem: '/poderesanime/imagenspoderes/kyoka.jpg', habilidadeEspecial: 'Kyoka Suigetsu (Hipnose Absoluta)' },
  { id: 'ichigo', nome: 'Ichigo Kurosaki', forca: 96, velocidade: 95, defesa: 88, resistencia: 93, energia: 95, poderEspecial: 96, imagem: '/poderesanime/imagenspoderes/getsuga.jpg', habilidadeEspecial: 'Mugetsu / Getsuga Tensho Final' },
  { id: 'dio', nome: 'DIO', forca: 93, velocidade: 96, defesa: 89, resistencia: 95, energia: 92, poderEspecial: 96, imagem: '/poderesanime/imagenspoderes/zawarudo.jpg', habilidadeEspecial: 'The World (Parada Temporal Total)' },
  { id: 'sung_jinwoo', nome: 'Sung Jin-woo', forca: 95, velocidade: 96, defesa: 90, resistencia: 93, energia: 97, poderEspecial: 97, imagem: '/poderesanime/imagenspoderes/arise.jpg', habilidadeEspecial: 'Arise (Monarca das Sombras)' },
  { id: 'naruto', nome: 'Naruto Uzumaki', forca: 91, velocidade: 93, defesa: 89, resistencia: 95, energia: 96, poderEspecial: 93, imagem: '/poderesanime/imagenspoderes/rasengan.jpg', habilidadeEspecial: 'Modo Sábio dos Seis Caminhos & Rasenshuriken' },
  { id: 'sasuke', nome: 'Sasuke Uchiha', forca: 90, velocidade: 94, defesa: 88, resistencia: 89, energia: 93, poderEspecial: 95, imagem: '/poderesanime/imagenspoderes/amaterasu.jpg', habilidadeEspecial: 'Chidori Ônyx & Amaterasu' },
  { id: 'vegeta', nome: 'Vegeta', forca: 95, velocidade: 91, defesa: 88, resistencia: 92, energia: 94, poderEspecial: 94, imagem: '/poderesanime/imagenspoderes/finalflash.jpg', habilidadeEspecial: 'Final Flash Destruidor' },
  { id: 'all_might', nome: 'All Might', forca: 96, velocidade: 88, defesa: 90, resistencia: 92, energia: 88, poderEspecial: 93, imagem: '/poderesanime/imagenspoderes/unitedstatesofsmash.jpg', habilidadeEspecial: 'United States of Smash' },
  { id: 'meruem', nome: 'Meruem', forca: 97, velocidade: 95, defesa: 99, resistencia: 97, energia: 93, poderEspecial: 96, imagem: '/poderesanime/imagenspoderes/meruem.jpg', habilidadeEspecial: 'Fúria Fotônica do Rei das Formigas Quimera' },
  { id: 'tatsumaki', nome: 'Tatsumaki', forca: 82, velocidade: 90, defesa: 85, resistencia: 86, energia: 95, poderEspecial: 96, imagem: '/poderesanime/imagenspoderes/tatsumaki.jpg', habilidadeEspecial: 'Tempestade Gravitacional Psíquica' },
  { id: 'luffy', nome: 'Monkey D. Luffy', forca: 95, velocidade: 90, defesa: 86, resistencia: 94, energia: 93, poderEspecial: 94, imagem: '/poderesanime/imagenspoderes/gomugomunogatling.jpg', habilidadeEspecial: 'Gear 5: Gomu Gomu no Bajrang Gun' },
  { id: 'zoro', nome: 'Roronoa Zoro', forca: 94, velocidade: 86, defesa: 85, resistencia: 91, energia: 87, poderEspecial: 90, imagem: '/poderesanime/imagenspoderes/ashura.jpg', habilidadeEspecial: 'Ashura Ichibugin (Lâmina Tríplice do Demônio)' },
  { id: 'madara', nome: 'Madara Uchiha', forca: 95, velocidade: 93, defesa: 92, resistencia: 94, energia: 96, poderEspecial: 97, imagem: '/poderesanime/imagenspoderes/susanoo.jpg', habilidadeEspecial: 'Susanoo Perfeito & Chibaku Tensei' },
  { id: 'whitebeard', nome: 'Edward Newgate (Barba Branca)', forca: 99, velocidade: 83, defesa: 93, resistencia: 97, energia: 95, poderEspecial: 96, imagem: '/poderesanime/imagenspoderes/tremor.jpg', habilidadeEspecial: 'Gura Gura no Mi: Terremoto Supremo' },
  { id: 'levi', nome: 'Levi Ackerman', forca: 85, velocidade: 97, defesa: 81, resistencia: 88, energia: 83, poderEspecial: 88, imagem: '/poderesanime/imagenspoderes/leviackerman.jpg', habilidadeEspecial: 'Lâminas Relâmpago do Soldado Mais Forte' },
  { id: 'todoroki', nome: 'Shoto Todoroki', forca: 83, velocidade: 81, defesa: 82, resistencia: 84, energia: 86, poderEspecial: 87, imagem: '/poderesanime/imagenspoderes/todoroki.jpg', habilidadeEspecial: 'Flashfire & Fusão Gelo-Chamas (Phosphor)' },
  { id: 'bakugo', nome: 'Katsuki Bakugo', forca: 84, velocidade: 85, defesa: 79, resistencia: 82, energia: 84, poderEspecial: 86, imagem: '/poderesanime/imagenspoderes/bakugo.jpg', habilidadeEspecial: 'Howitzer Impact Supreme' },
  { id: 'deku', nome: 'Izuku Midoriya (Deku)', forca: 85, velocidade: 83, defesa: 80, resistencia: 84, energia: 82, poderEspecial: 86, imagem: '/poderesanime/imagenspoderes/ofa.jpg', habilidadeEspecial: 'Gearshift: Smash 120% Transcendente' },
  { id: 'saber', nome: 'Artoria Pendragon (Saber)', forca: 88, velocidade: 86, defesa: 90, resistencia: 87, energia: 88, poderEspecial: 91, imagem: '/poderesanime/imagenspoderes/excalibur.jpg', habilidadeEspecial: 'Excalibur: Espada Prometida da Vitória' },
  { id: 'gilgamesh', nome: 'Gilgamesh', forca: 91, velocidade: 89, defesa: 87, resistencia: 88, energia: 93, poderEspecial: 95, imagem: '/poderesanime/imagenspoderes/enuma.jpg', habilidadeEspecial: 'Enuma Elish (Ea — Estrela da Criação)' },
  { id: 'yami', nome: 'Yami Sukehiro', forca: 88, velocidade: 84, defesa: 83, resistencia: 86, energia: 82, poderEspecial: 86, imagem: '/poderesanime/imagenspoderes/yami.jpg', habilidadeEspecial: 'Magia de Escuridão: Corte Dimensional Equinócio' },
  { id: 'eren', nome: 'Eren Yeager', forca: 91, velocidade: 82, defesa: 88, resistencia: 93, energia: 87, poderEspecial: 88, imagem: '/poderesanime/imagenspoderes/titafundador.jpg', habilidadeEspecial: 'Rugido do Titã de Ataque & Endurecimento' },
  { id: 'ace', nome: 'Portgas D. Ace', forca: 88, velocidade: 87, defesa: 82, resistencia: 86, energia: 89, poderEspecial: 89, imagem: '/poderesanime/imagenspoderes/entei.jpg', habilidadeEspecial: 'Grande Imperador das Chamas: Dai Entei' },
  { id: 'killua', nome: 'Killua Zoldyck', forca: 81, velocidade: 91, defesa: 78, resistencia: 80, energia: 84, poderEspecial: 85, imagem: '/poderesanime/imagenspoderes/kanmuru.jpg', habilidadeEspecial: 'Kanmuru (Velocidade Divina dos Raios)' },
  { id: 'tomioka', nome: 'Giyu Tomioka', forca: 82, velocidade: 84, defesa: 86, resistencia: 82, energia: 81, poderEspecial: 83, imagem: '/poderesanime/imagenspoderes/respiracaoagua.jpg', habilidadeEspecial: 'Respiração da Água: 11ª Forma (Calmaria)' },
  { id: 'mustang', nome: 'Roy Mustang', forca: 80, velocidade: 82, defesa: 77, resistencia: 79, energia: 86, poderEspecial: 87, imagem: '/poderesanime/imagenspoderes/alquimiadaschamas.jpg', habilidadeEspecial: 'Estalo Flamejante de Precisão Cirúrgica' },
  { id: 'piccolo', nome: 'Piccolo', forca: 84, velocidade: 83, defesa: 85, resistencia: 85, energia: 84, poderEspecial: 85, imagem: '/poderesanime/imagenspoderes/makankasappo.jpg', habilidadeEspecial: 'Makankosappo Perfurador de Armaduras' },
  { id: 'sanji', nome: 'Vinsmoke Sanji', forca: 84, velocidade: 88, defesa: 82, resistencia: 84, energia: 80, poderEspecial: 83, imagem: '/poderesanime/imagenspoderes/diablejambe.jpg', habilidadeEspecial: 'Ifrit Jambe: Flambage Shot' },
  { id: 'byakuya', nome: 'Byakuya Kuchiki', forca: 82, velocidade: 87, defesa: 83, resistencia: 81, energia: 85, poderEspecial: 86, imagem: '/poderesanime/imagenspoderes/senbonzaukura.jpg', habilidadeEspecial: 'Bankai: Senbonzakura Kageyoshi' },
  { id: 'endeavor', nome: 'Endeavor', forca: 85, velocidade: 80, defesa: 82, resistencia: 84, energia: 85, poderEspecial: 86, imagem: '/poderesanime/imagenspoderes/prominennce.jpg', habilidadeEspecial: 'Prominence Burn Incinerador' },
  { id: 'tanjiro', nome: 'Tanjiro Kamado', forca: 74, velocidade: 75, defesa: 73, resistencia: 78, energia: 72, poderEspecial: 75, imagem: '/poderesanime/imagenspoderes/kagura.jpg', habilidadeEspecial: 'Dança do Deus do Fogo: Valsa Solar' },
  { id: 'gon', nome: 'Gon Freecss', forca: 76, velocidade: 73, defesa: 71, resistencia: 77, energia: 75, poderEspecial: 74, imagem: '/poderesanime/imagenspoderes/jajaken.jpg', habilidadeEspecial: 'Jajanken: Pedra Esmagadora' },
  { id: 'edward', nome: 'Edward Elric', forca: 72, velocidade: 75, defesa: 74, resistencia: 73, energia: 76, poderEspecial: 76, imagem: '/poderesanime/imagenspoderes/semcirculo.jpg', habilidadeEspecial: 'Transmutação Alquímica Direta' },
  { id: 'zenitsu', nome: 'Zenitsu Agatsuma', forca: 70, velocidade: 82, defesa: 68, resistencia: 70, energia: 71, poderEspecial: 75, imagem: '/poderesanime/imagenspoderes/zenitsu.jpg', habilidadeEspecial: 'Respiração do Trovão: Primeira Forma Seis Dobras' },
  { id: 'armin', nome: 'Armin Arlert', forca: 75, velocidade: 66, defesa: 77, resistencia: 79, energia: 74, poderEspecial: 78, imagem: '/poderesanime/imagenspoderes/titacolossal.jpg', habilidadeEspecial: 'Vapor Térmico do Titã Colossal' },
  { id: 'asta', nome: 'Asta', forca: 77, velocidade: 76, defesa: 74, resistencia: 80, energia: 65, poderEspecial: 75, imagem: '/poderesanime/imagenspoderes/antimagia.jpg', habilidadeEspecial: 'Corte Anti-Magia Demon-Dweller' },
  { id: 'denji', nome: 'Denji', forca: 76, velocidade: 74, defesa: 72, resistencia: 82, energia: 70, poderEspecial: 74, imagem: '/poderesanime/imagenspoderes/chainsaw.jpg', habilidadeEspecial: 'Arrancada da Motosserra Diabólica' },
];

/** Mapa rápido id → personagem para consultas O(1) */
export const CHARACTERS_BY_ID = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));

/** Stat keys usadas nas builds */
export const STAT_KEYS = ['forca', 'velocidade', 'defesa', 'resistencia', 'energia', 'poderEspecial'];

/**
 * Limites absolutos derivados do catálogo real.
 * Qualquer stat individual acima de MAX_STAT_VALUE é forjado.
 * Qualquer soma de 6 stats acima de MAX_STAT_SUM é forjada.
 */
export const MAX_STAT_VALUE = 99;
export const MAX_STAT_SUM = 592; // cherry-pick do melhor stat de cada personagem

