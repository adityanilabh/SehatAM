/**
 * The built-in food list for India: common foods with the calories in one usual
 * serving. Figures are typical values for home-style food and are estimates; real
 * dishes vary with oil, ghee and portion size.
 *
 * Each row is: names (separated by |), kcal per serving, what one serving is, and
 * the kind of serving. The kind decides how units typed by the user are handled:
 *   piece  - counted items (a roti, an egg)
 *   bowl   - one katori, about 150 g; a "plate" counts as one and a half
 *   plate  - one plate; a "katori" counts as two thirds
 *   glass  - one glass, about 250 ml
 *   cup    - one tea cup, about 150 ml
 *   tsp    - one teaspoon; a tablespoon is three
 *   tbsp   - one tablespoon
 *   grams  - the serving is a weight, given as the fifth value
 * A fifth value gives the serving's weight in grams (or ml), so amounts typed in
 * grams work for that food.
 */

export type ServingKind = 'piece' | 'bowl' | 'plate' | 'glass' | 'cup' | 'tsp' | 'tbsp' | 'grams';

type Row = [names: string, kcal: number, serving: string, kind: ServingKind, grams?: number];

const ROWS: Row[] = [
  // Breads
  ['roti|chapati|chapatti|phulka|fulka', 80, '1 roti', 'piece'],
  ['tandoori roti', 110, '1 roti', 'piece'],
  ['missi roti', 130, '1 roti', 'piece'],
  ['bajra roti|bajre ki roti', 115, '1 roti', 'piece'],
  ['jowar roti|bhakri', 100, '1 roti', 'piece'],
  ['makki roti|makki ki roti', 150, '1 roti', 'piece'],
  ['rumali roti', 180, '1 roti', 'piece'],
  ['paratha|parantha|plain paratha', 180, '1 paratha', 'piece'],
  ['aloo paratha|aloo parantha', 250, '1 paratha', 'piece'],
  ['gobi paratha|gobhi paratha', 230, '1 paratha', 'piece'],
  ['paneer paratha', 280, '1 paratha', 'piece'],
  ['methi paratha', 190, '1 paratha', 'piece'],
  ['thepla', 120, '1 thepla', 'piece'],
  ['puri|poori', 100, '1 puri', 'piece'],
  ['bhatura|bhature', 290, '1 bhatura', 'piece'],
  ['naan|plain naan', 260, '1 naan', 'piece'],
  ['butter naan', 310, '1 naan', 'piece'],
  ['garlic naan', 300, '1 naan', 'piece'],
  ['kulcha', 220, '1 kulcha', 'piece'],
  ['bread|white bread|bread slice|toast', 70, '1 slice', 'piece'],
  ['brown bread|wheat bread|multigrain bread', 70, '1 slice', 'piece'],
  ['bread butter|butter toast', 110, '1 slice with butter', 'piece'],
  ['pav|pao', 100, '1 pav', 'piece'],
  ['bun', 150, '1 bun', 'piece'],
  ['khakhra', 60, '1 khakhra', 'piece'],

  // South Indian and breakfast
  ['dosa|plain dosa', 130, '1 dosa', 'piece'],
  ['masala dosa', 330, '1 dosa', 'piece'],
  ['rava dosa', 190, '1 dosa', 'piece'],
  ['uttapam|uthappam', 180, '1 uttapam', 'piece'],
  ['idli|idly', 45, '1 idli', 'piece'],
  ['medu vada|vada|wada', 130, '1 vada', 'piece'],
  ['appam', 120, '1 appam', 'piece'],
  ['pesarattu', 150, '1 pesarattu', 'piece'],
  ['upma', 200, '1 katori', 'bowl', 150],
  ['poha', 180, '1 katori', 'bowl', 150],
  ['sabudana khichdi', 290, '1 katori', 'bowl', 150],
  ['dhokla', 50, '1 piece', 'piece'],
  ['khandvi', 25, '1 piece', 'piece'],
  ['besan chilla|besan cheela|chilla|cheela', 130, '1 chilla', 'piece'],
  ['moong dal chilla|moong chilla|moong dal cheela|moong cheela', 120, '1 chilla', 'piece'],
  ['oats|oatmeal|porridge', 150, '1 katori', 'bowl', 200],
  ['daliya|dalia', 150, '1 katori', 'bowl', 200],
  ['cornflakes|corn flakes', 180, '1 bowl with milk', 'bowl'],
  ['muesli', 250, '1 bowl with milk', 'bowl'],

  // Eggs
  ['egg|whole egg|egg whole|boiled egg|anda', 72, '1 egg', 'piece'],
  ['egg white', 17, '1 egg white', 'piece'],
  ['omelette|omelet', 95, '1 egg omelette', 'piece'],
  ['fried egg', 90, '1 egg', 'piece'],
  ['egg bhurji|scrambled egg|anda bhurji', 100, '1 egg', 'piece'],
  ['egg curry', 250, '1 katori (2 eggs)', 'bowl'],

  // Rice
  ['rice|plain rice|white rice|chawal|steamed rice', 200, '1 katori', 'bowl', 150],
  ['brown rice', 170, '1 katori', 'bowl', 150],
  ['jeera rice', 230, '1 katori', 'bowl', 150],
  ['pulao|veg pulao|pulav', 230, '1 katori', 'bowl', 150],
  ['veg biryani|biryani', 270, '1 katori', 'bowl', 150],
  ['chicken biryani|mutton biryani', 300, '1 katori', 'bowl', 150],
  ['khichdi|khichri', 200, '1 katori', 'bowl', 150],
  ['curd rice', 220, '1 katori', 'bowl', 150],
  ['lemon rice', 250, '1 katori', 'bowl', 150],
  ['fried rice', 260, '1 katori', 'bowl', 150],

  // Dals and legumes
  ['dal|toor dal|arhar dal|yellow dal', 150, '1 katori', 'bowl', 150],
  ['dal tadka|dal fry', 180, '1 katori', 'bowl', 150],
  ['moong dal', 130, '1 katori', 'bowl', 150],
  ['masoor dal', 150, '1 katori', 'bowl', 150],
  ['chana dal', 190, '1 katori', 'bowl', 150],
  ['dal makhani', 280, '1 katori', 'bowl', 150],
  ['rajma', 210, '1 katori', 'bowl', 150],
  ['chole|chana masala|chhole', 240, '1 katori', 'bowl', 150],
  ['kala chana', 200, '1 katori', 'bowl', 150],
  ['lobia', 190, '1 katori', 'bowl', 150],
  ['sambar|sambhar', 130, '1 katori', 'bowl', 150],
  ['rasam', 60, '1 katori', 'bowl', 150],
  ['kadhi', 150, '1 katori', 'bowl', 150],
  ['sprouts', 100, '1 katori', 'bowl', 100],
  ['boiled chana', 180, '1 katori', 'bowl', 100],

  // Vegetable dishes
  ['sabzi|sabji|mixed veg|mix veg|vegetable', 140, '1 katori', 'bowl', 150],
  ['aloo sabzi|aloo sabji|aloo', 180, '1 katori', 'bowl', 150],
  ['aloo gobi|aloo gobhi', 150, '1 katori', 'bowl', 150],
  ['aloo matar', 170, '1 katori', 'bowl', 150],
  ['dum aloo', 250, '1 katori', 'bowl', 150],
  ['bhindi|bhindi sabzi', 130, '1 katori', 'bowl', 150],
  ['baingan bharta', 130, '1 katori', 'bowl', 150],
  ['cabbage sabzi|patta gobhi', 100, '1 katori', 'bowl', 150],
  ['lauki|lauki sabzi|ghiya', 80, '1 katori', 'bowl', 150],
  ['tinda', 80, '1 katori', 'bowl', 150],
  ['karela', 110, '1 katori', 'bowl', 150],
  ['gajar matar', 120, '1 katori', 'bowl', 150],
  ['saag|palak', 150, '1 katori', 'bowl', 150],
  ['sarson ka saag', 180, '1 katori', 'bowl', 150],
  ['mushroom masala|mushroom', 180, '1 katori', 'bowl', 150],
  ['soya chunks|soya curry|soyabean', 200, '1 katori', 'bowl', 150],
  ['malai kofta', 350, '1 katori', 'bowl', 150],

  // Paneer
  ['paneer', 130, '50 g', 'grams', 50],
  ['palak paneer', 270, '1 katori', 'bowl', 150],
  ['paneer butter masala|butter paneer', 350, '1 katori', 'bowl', 150],
  ['shahi paneer', 350, '1 katori', 'bowl', 150],
  ['matar paneer', 280, '1 katori', 'bowl', 150],
  ['kadai paneer|paneer sabzi|paneer sabji', 300, '1 katori', 'bowl', 150],
  ['paneer bhurji', 280, '1 katori', 'bowl', 150],
  ['paneer tikka', 60, '1 piece', 'piece'],
  ['tofu', 80, '100 g', 'grams', 100],

  // Chicken, meat and fish
  ['chicken curry|chicken', 250, '1 katori', 'bowl', 150],
  ['butter chicken', 350, '1 katori', 'bowl', 150],
  ['chicken tikka', 45, '1 piece', 'piece'],
  ['tandoori chicken', 180, '1 piece', 'piece'],
  ['chicken breast|grilled chicken', 165, '100 g', 'grams', 100],
  ['mutton curry|mutton', 300, '1 katori', 'bowl', 150],
  ['keema', 300, '1 katori', 'bowl', 150],
  ['fish curry', 220, '1 katori', 'bowl', 150],
  ['fish fry|fried fish|fish', 180, '1 piece', 'piece'],
  ['prawn curry|prawns', 200, '1 katori', 'bowl', 150],

  // Dairy
  ['milk', 150, '1 glass', 'glass', 250],
  ['skim milk|skimmed milk|toned milk', 100, '1 glass', 'glass', 250],
  ['curd|dahi|yogurt|yoghurt', 90, '1 katori', 'bowl', 150],
  ['greek yogurt|greek yoghurt', 120, '1 cup', 'bowl', 150],
  ['raita', 80, '1 katori', 'bowl', 150],
  ['lassi|sweet lassi', 220, '1 glass', 'glass', 250],
  ['chaas|buttermilk|chhach', 45, '1 glass', 'glass', 250],
  ['cheese|cheese slice', 60, '1 slice', 'piece'],
  ['butter', 35, '1 tsp', 'tsp', 5],
  ['ghee', 45, '1 tsp', 'tsp', 5],
  ['oil', 40, '1 tsp', 'tsp', 5],
  ['cream|malai', 50, '1 tbsp', 'tbsp', 15],

  // Drinks
  ['chai|tea|milk tea|chai with sugar|tea with sugar', 90, '1 cup', 'cup', 150],
  ['chai without sugar|tea without sugar|sugarless chai|sugar free chai', 50, '1 cup', 'cup', 150],
  ['black tea|green tea|lemon tea', 2, '1 cup', 'cup', 150],
  ['coffee|milk coffee|coffee with sugar|filter coffee', 90, '1 cup', 'cup', 150],
  ['black coffee', 5, '1 cup', 'cup', 150],
  ['cold coffee', 200, '1 glass', 'glass', 250],
  ['nimbu pani|lemonade|shikanji', 60, '1 glass', 'glass', 250],
  ['coconut water|nariyal pani', 45, '1 glass', 'glass', 250],
  ['juice|orange juice|fruit juice', 110, '1 glass', 'glass', 250],
  ['mango shake|banana shake|milkshake', 230, '1 glass', 'glass', 250],
  ['soft drink|cold drink|coke|pepsi|cola', 105, '1 glass', 'glass', 250],
  ['beer', 150, '1 glass (330 ml)', 'glass', 330],
  ['whisky|whiskey|rum|vodka', 70, '1 peg (30 ml)', 'piece'],
  ['wine', 125, '1 glass (150 ml)', 'glass', 150],
  ['protein shake|whey|whey protein|protein powder', 120, '1 scoop', 'piece'],

  // Fruit
  ['banana|kela', 100, '1 banana', 'piece'],
  ['apple|seb', 95, '1 apple', 'piece'],
  ['orange|santra', 60, '1 orange', 'piece'],
  ['mango|aam', 150, '1 mango', 'piece'],
  ['guava|amrood', 60, '1 guava', 'piece'],
  ['papaya', 60, '1 katori', 'bowl', 150],
  ['watermelon', 45, '1 katori', 'bowl', 150],
  ['muskmelon|kharbuja', 55, '1 katori', 'bowl', 150],
  ['grapes', 100, '1 katori', 'bowl', 150],
  ['pomegranate|anar', 120, '1 katori', 'bowl', 150],
  ['pineapple', 80, '1 katori', 'bowl', 150],
  ['strawberries|strawberry', 50, '1 katori', 'bowl', 150],
  ['chikoo|sapota', 95, '1 chikoo', 'piece'],
  ['pear', 100, '1 pear', 'piece'],
  ['kiwi', 45, '1 kiwi', 'piece'],
  ['dates|khajoor', 25, '1 date', 'piece'],
  ['avocado', 240, '1 avocado', 'piece'],
  ['fruit salad|fruit chaat|fruit', 100, '1 katori', 'bowl', 150],

  // Nuts and seeds
  ['almond|badam', 7, '1 almond', 'piece'],
  ['cashew|kaju', 9, '1 cashew', 'piece'],
  ['walnut|akhrot', 26, '1 walnut', 'piece'],
  ['pistachio|pista', 4, '1 pistachio', 'piece'],
  ['peanut|moongfali', 170, '1 handful (30 g)', 'grams', 30],
  ['nuts|mixed nuts|dry fruits', 180, '1 handful (30 g)', 'grams', 30],
  ['raisins|kishmish', 30, '1 tbsp', 'tbsp', 10],
  ['peanut butter', 95, '1 tbsp', 'tbsp', 16],
  ['makhana|fox nuts', 100, '1 katori', 'bowl', 25],
  ['roasted chana|bhuna chana', 120, '1 handful (30 g)', 'grams', 30],
  ['chia seeds|flax seeds|seeds', 55, '1 tbsp', 'tbsp', 12],

  // Snacks and street food
  ['samosa', 260, '1 samosa', 'piece'],
  ['kachori', 190, '1 kachori', 'piece'],
  ['pakora|pakoda|bhajiya|bhaji', 60, '1 pakora', 'piece'],
  ['vada pav', 300, '1 vada pav', 'piece'],
  ['pav bhaji', 400, '1 plate (2 pav)', 'plate'],
  ['bhel puri|bhel', 250, '1 plate', 'plate'],
  ['pani puri|golgappa|gol gappa|puchka', 30, '1 puri', 'piece'],
  ['sev puri|dahi puri|chaat|papdi chaat', 300, '1 plate', 'plate'],
  ['aloo tikki', 150, '1 tikki', 'piece'],
  ['dabeli', 200, '1 dabeli', 'piece'],
  ['momo', 40, '1 momo', 'piece'],
  ['spring roll', 150, '1 roll', 'piece'],
  ['cutlet', 120, '1 cutlet', 'piece'],
  ['french fries|fries', 300, '1 plate', 'plate'],
  ['chips|wafers', 160, '1 small packet (30 g)', 'grams', 30],
  ['namkeen|mixture|bhujia|sev', 160, '1 handful (30 g)', 'grams', 30],
  ['biscuit|cookie', 35, '1 biscuit', 'piece'],
  ['marie biscuit', 22, '1 biscuit', 'piece'],
  ['rusk', 40, '1 rusk', 'piece'],
  ['mathri', 90, '1 mathri', 'piece'],
  ['popcorn', 60, '1 katori', 'bowl', 15],
  ['maggi|instant noodles', 310, '1 packet', 'piece'],
  ['sandwich|veg sandwich', 250, '1 sandwich', 'piece'],
  ['grilled sandwich|cheese sandwich', 300, '1 sandwich', 'piece'],
  ['burger|veg burger', 350, '1 burger', 'piece'],
  ['chicken burger', 400, '1 burger', 'piece'],
  ['pizza|pizza slice', 280, '1 slice', 'piece'],
  ['pasta', 250, '1 katori', 'bowl', 150],
  ['noodles|hakka noodles|chowmein', 350, '1 plate', 'plate'],
  ['manchurian', 300, '1 plate', 'plate'],
  ['roll|kathi roll|frankie|egg roll', 350, '1 roll', 'piece'],
  ['chicken roll|paneer roll', 400, '1 roll', 'piece'],
  ['protein bar', 200, '1 bar', 'piece'],
  ['chikki|peanut chikki', 100, '1 piece', 'piece'],

  // Sweets
  ['gulab jamun', 150, '1 piece', 'piece'],
  ['rasgulla', 110, '1 piece', 'piece'],
  ['rasmalai', 170, '1 piece', 'piece'],
  ['jalebi', 150, '1 piece', 'piece'],
  ['laddu|ladoo|besan laddu', 180, '1 laddu', 'piece'],
  ['motichoor laddu', 150, '1 laddu', 'piece'],
  ['barfi|burfi', 150, '1 piece', 'piece'],
  ['kaju katli', 55, '1 piece', 'piece'],
  ['halwa|suji halwa|gajar halwa|gajar ka halwa', 300, '1 katori', 'bowl', 150],
  ['kheer|payasam', 230, '1 katori', 'bowl', 150],
  ['ice cream|icecream', 140, '1 scoop', 'piece'],
  ['kulfi', 160, '1 kulfi', 'piece'],
  ['chocolate', 210, '1 bar (40 g)', 'grams', 40],
  ['cake', 300, '1 slice', 'piece'],
  ['pastry', 300, '1 pastry', 'piece'],
  ['sugar|cheeni', 16, '1 tsp', 'tsp', 4],
  ['jaggery|gur', 38, '1 piece (10 g)', 'grams', 10],
  ['honey', 21, '1 tsp', 'tsp', 7],
  ['jam', 50, '1 tbsp', 'tbsp', 20],

  // Salad, vegetables and soup
  ['salad|green salad', 40, '1 katori', 'bowl', 150],
  ['cucumber|kheera', 30, '1 cucumber', 'piece'],
  ['tomato', 22, '1 tomato', 'piece'],
  ['onion', 45, '1 onion', 'piece'],
  ['carrot|gajar', 25, '1 carrot', 'piece'],
  ['boiled potato|potato', 110, '1 potato', 'piece'],
  ['sweet potato|shakarkandi', 110, '1 sweet potato', 'piece'],
  ['corn|bhutta', 130, '1 corn', 'piece'],
  ['sweet corn', 130, '1 katori', 'bowl', 150],
  ['soup|tomato soup|veg soup', 80, '1 katori', 'bowl', 200],
  ['chicken soup', 80, '1 katori', 'bowl', 200],
  ['papad', 40, '1 papad', 'piece'],
  ['pickle|achar', 15, '1 tsp', 'tsp', 5],
  ['chutney', 20, '1 tbsp', 'tbsp', 15],
];

export type Food = {
  /** The first name, used as the label. */
  name: string;
  names: string[];
  kcal: number;
  serving: string;
  kind: ServingKind;
  /** Weight of one serving in grams (or ml), when known. */
  grams: number | null;
};

export const INDIA_FOODS: Food[] = ROWS.map(([names, kcal, serving, kind, grams]) => {
  const list = names.split('|');
  return { name: list[0], names: list, kcal, serving, kind, grams: grams ?? null };
});
