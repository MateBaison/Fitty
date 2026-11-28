/**
 * What else to watch besides the three macros. Texts are Spanish/English pairs
 * for `translate`; `{n}` in an amount stands for grams that follow the calories.
 */

type Text = readonly [es: string, en: string];

export type NutritionExtra = {
  id: string;
  name: Text;
  amount?: Text;
  /** Share of the calories behind `{n}`, and the energy of one gram. */
  limit?: { percent: number; kcalPerGram: number };
  benefit: Text;
  foods: Text;
};

export type NutritionExtraGroup = {
  id: string;
  title: Text;
  items: readonly NutritionExtra[];
};

export const nutritionExtraGroups: readonly NutritionExtraGroup[] = [
  {
    id: "daily",
    title: ["Para todos los días", "Every day"],
    items: [
      {
        id: "fiber",
        name: ["Fibra", "Fiber"],
        amount: ["Al menos 25 g por día", "At least 25 g a day"],
        benefit: [
          "Ayuda a la digestión, da saciedad y se asocia con menos enfermedades del corazón, diabetes tipo 2 y cáncer de colon.",
          "Helps digestion, keeps you full and is linked to less heart disease, type 2 diabetes and colon cancer.",
        ],
        foods: [
          "Avena, pan y arroz integrales, lentejas, porotos, garbanzos, frutas, verduras y frutos secos.",
          "Oats, wholegrain bread and rice, lentils, beans, chickpeas, fruit, vegetables and nuts.",
        ],
      },
      {
        id: "produce",
        name: ["Frutas y verduras", "Fruit and vegetables"],
        amount: [
          "Al menos 400 g por día (unas 5 porciones)",
          "At least 400 g a day (about 5 portions)",
        ],
        benefit: [
          "Aportan vitaminas, minerales y fibra con pocas calorías, y bajan el riesgo de enfermedades crónicas.",
          "They give vitamins, minerals and fiber for few calories and lower the risk of chronic disease.",
        ],
        foods: [
          "Variá los colores a lo largo de la semana. Las papas y la mandioca no cuentan.",
          "Vary the colors during the week. Potatoes and cassava do not count.",
        ],
      },
      {
        id: "water",
        name: ["Agua", "Water"],
        amount: [
          "Cerca de 2 L (mujeres) o 2,5 L (hombres) por día, contando bebidas y comida",
          "About 2 L (women) or 2.5 L (men) a day, counting drinks and food",
        ],
        benefit: [
          "Regula la temperatura y ayuda a rendir al entrenar. Con calor o mucho ejercicio hace falta más.",
          "Regulates temperature and supports training performance. Heat or a lot of exercise call for more.",
        ],
        foods: [
          "Agua como bebida principal; frutas, verduras y sopas también suman.",
          "Water as your main drink; fruit, vegetables and soups also count.",
        ],
      },
      {
        id: "omega3",
        name: ["Omega-3 (EPA y DHA)", "Omega-3 (EPA and DHA)"],
        amount: ["250 mg por día", "250 mg a day"],
        benefit: [
          "Son grasas que cuidan el corazón.",
          "Fats that look after your heart.",
        ],
        foods: [
          "Pescado graso (salmón, sardina, atún, caballa) una o dos veces por semana.",
          "Oily fish (salmon, sardines, tuna, mackerel) once or twice a week.",
        ],
      },
    ],
  },
  {
    id: "micronutrients",
    title: ["Vitaminas y minerales", "Vitamins and minerals"],
    items: [
      {
        id: "vitaminA",
        name: ["Vitamina A", "Vitamin A"],
        benefit: [
          "Cuida la vista, la piel y las defensas.",
          "Supports eyesight, skin and immunity.",
        ],
        foods: [
          "Zanahoria, calabaza, boniato, espinaca, huevo y lácteos.",
          "Carrot, pumpkin, sweet potato, spinach, eggs and dairy.",
        ],
      },
      {
        id: "vitaminC",
        name: ["Vitamina C", "Vitamin C"],
        benefit: [
          "Ayuda a las defensas, a formar colágeno y a absorber el hierro de los vegetales.",
          "Helps immunity, collagen building and absorbing iron from plants.",
        ],
        foods: [
          "Cítricos, kiwi, frutilla, morrón, brócoli y tomate.",
          "Citrus fruit, kiwi, strawberries, peppers, broccoli and tomatoes.",
        ],
      },
      {
        id: "folate",
        name: ["Folato (vitamina B9)", "Folate (vitamin B9)"],
        benefit: [
          "Necesario para formar células nuevas; es clave antes y durante el embarazo.",
          "Needed to make new cells; key before and during pregnancy.",
        ],
        foods: [
          "Verduras de hoja verde, legumbres, espárragos y naranja.",
          "Leafy greens, legumes, asparagus and oranges.",
        ],
      },
      {
        id: "vitaminK",
        name: ["Vitamina K", "Vitamin K"],
        benefit: [
          "Interviene en la coagulación de la sangre y en la salud de los huesos.",
          "Takes part in blood clotting and bone health.",
        ],
        foods: [
          "Espinaca, acelga, kale, brócoli y repollo.",
          "Spinach, chard, kale, broccoli and cabbage.",
        ],
      },
      {
        id: "vitaminD",
        name: ["Vitamina D", "Vitamin D"],
        benefit: [
          "Ayuda a absorber el calcio y cuida huesos y músculos.",
          "Helps absorb calcium and looks after bones and muscles.",
        ],
        foods: [
          "Sol con cuidado, pescado graso, yema de huevo y alimentos fortificados.",
          "Careful sun exposure, oily fish, egg yolk and fortified foods.",
        ],
      },
      {
        id: "vitaminB12",
        name: ["Vitamina B12", "Vitamin B12"],
        benefit: [
          "Necesaria para los nervios y los glóbulos rojos. Quien no come productos animales necesita suplemento o alimentos fortificados.",
          "Needed for nerves and red blood cells. People who eat no animal products need a supplement or fortified foods.",
        ],
        foods: [
          "Carne, pescado, huevo y lácteos.",
          "Meat, fish, eggs and dairy.",
        ],
      },
      {
        id: "calcium",
        name: ["Calcio", "Calcium"],
        benefit: [
          "Forma huesos y dientes y permite que los músculos se contraigan.",
          "Builds bones and teeth and lets muscles contract.",
        ],
        foods: [
          "Leche, yogur, queso, sardinas con espinas, tofu y verduras de hoja.",
          "Milk, yogurt, cheese, sardines with bones, tofu and leafy greens.",
        ],
      },
      {
        id: "iron",
        name: ["Hierro", "Iron"],
        benefit: [
          "Transporta oxígeno en la sangre; si falta, aparece cansancio.",
          "Carries oxygen in the blood; too little causes tiredness.",
        ],
        foods: [
          "Carne, pescado, legumbres y cereales fortificados.",
          "Meat, fish, legumes and fortified cereals.",
        ],
      },
      {
        id: "magnesium",
        name: ["Magnesio", "Magnesium"],
        benefit: [
          "Participa en el funcionamiento de músculos y nervios y en la producción de energía.",
          "Takes part in muscle and nerve function and energy production.",
        ],
        foods: [
          "Frutos secos, semillas, legumbres, cereales integrales y hojas verdes.",
          "Nuts, seeds, legumes, wholegrains and leafy greens.",
        ],
      },
      {
        id: "potassium",
        name: ["Potasio", "Potassium"],
        amount: ["Al menos 3,5 g por día", "At least 3.5 g a day"],
        benefit: [
          "Ayuda a controlar la presión arterial y al trabajo muscular.",
          "Helps control blood pressure and supports muscle work.",
        ],
        foods: [
          "Banana, papa, legumbres, tomate, verduras de hoja y frutas.",
          "Bananas, potatoes, legumes, tomatoes, leafy greens and fruit.",
        ],
      },
    ],
  },
  {
    id: "limits",
    title: ["Para limitar", "Keep low"],
    items: [
      {
        id: "sugar",
        name: ["Azúcares añadidos", "Added sugars"],
        amount: ["Menos de {n} g por día", "Less than {n} g a day"],
        limit: { percent: 10, kcalPerGram: 4 },
        benefit: [
          "Comer menos reduce las caries y el exceso de peso. Incluye los de jugos y miel.",
          "Eating less means fewer cavities and less excess weight. Juice and honey sugars count.",
        ],
        foods: [
          "Refrescos, jugos, golosinas, galletitas y postres.",
          "Soft drinks, juices, sweets, biscuits and desserts.",
        ],
      },
      {
        id: "saturatedFat",
        name: ["Grasas saturadas", "Saturated fat"],
        amount: ["Menos de {n} g por día", "Less than {n} g a day"],
        limit: { percent: 10, kcalPerGram: 9 },
        benefit: [
          "Cambiarlas por aceite de oliva, frutos secos, palta o pescado cuida el corazón.",
          "Swapping them for olive oil, nuts, avocado or fish protects your heart.",
        ],
        foods: [
          "Carnes grasas, fiambres, manteca, queso y productos de panadería.",
          "Fatty and processed meats, butter, cheese and baked goods.",
        ],
      },
      {
        id: "transFat",
        name: ["Grasas trans", "Trans fat"],
        amount: ["Menos de {n} g por día", "Less than {n} g a day"],
        limit: { percent: 1, kcalPerGram: 9 },
        benefit: [
          "Suben el riesgo de enfermedad del corazón: cuanto menos, mejor.",
          "They raise the risk of heart disease: the less, the better.",
        ],
        foods: [
          "Productos con aceites parcialmente hidrogenados y algunas frituras.",
          "Products with partially hydrogenated oils and some fried foods.",
        ],
      },
      {
        id: "salt",
        name: ["Sal", "Salt"],
        amount: ["Menos de 5 g por día", "Less than 5 g a day"],
        benefit: [
          "Menos sal ayuda a prevenir la presión alta.",
          "Less salt helps prevent high blood pressure.",
        ],
        foods: [
          "Fiambres, quesos, snacks, caldos y comidas preparadas.",
          "Processed meats, cheese, snacks, stock cubes and ready meals.",
        ],
      },
    ],
  },
];

export const nutritionSources = [
  {
    label: "WHO · Healthy diet",
    url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
  },
  {
    label: "WHO · Carbohydrate intake",
    url: "https://www.who.int/publications/i/item/9789240073593",
  },
  {
    label: "EFSA · Dietary reference values",
    url: "https://www.efsa.europa.eu/sites/default/files/assets/DRV_Summary_tables_jan_17.pdf",
  },
  {
    label: "NIH · Vitamins and minerals",
    url: "https://ods.od.nih.gov/factsheets/list-VitaminsMinerals/",
  },
  {
    label: "ISSN · Protein and exercise",
    url: "https://pubmed.ncbi.nlm.nih.gov/28642676/",
  },
] as const;

/** The amount to show, with limits turned into grams for the daily calories. */
export function extraAmount(
  item: NutritionExtra,
  calories: number,
  text: (es: string, en: string) => string,
) {
  if (!item.amount) return null;
  const translated = text(...item.amount);
  if (!item.limit) return translated;
  // No gram figure while the calories are blank or out of range.
  if (!(calories >= 1000 && calories <= 6000)) return null;
  const grams = (calories * item.limit.percent) / 100 / item.limit.kcalPerGram;
  return translated.replace("{n}", String(Math.floor(grams)));
}
