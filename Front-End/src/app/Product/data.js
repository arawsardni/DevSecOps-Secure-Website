export const products = [
    // Americano Series
    {
        id: 1,
        image: '/Menu/AmericanoSeries/Americano Iced.jpg',
        title: 'Iced Americano',
        price: '21.000',
        sold: 152,
        rating: 5,
        category: "Americano Series",
        badge: 'Terlaris',
        description: 'Kopi klasik dengan rasa pahit yang menyegarkan, cocok diminum kapan saja.',
        reviews: [
            { user: "Budi", rating: 5, comment: "Enak banget", date: "2025-04-01" },
            { user: "Sari", rating: 4, comment: "Pas banget", date: "2025-03-30" },
            { user: "Sari", rating: 4, comment: "Pas banget", date: "2025-03-30" },
            { user: "Sari", rating: 4, comment: "Pas banget", date: "2025-03-30" },
            { user: "Sari", rating: 4, comment: "Pas banget", date: "2025-03-30" },
            { user: "Sari", rating: 4, comment: "Pas banget", date: "2025-03-30" },
            
        ]  
    },
    { id: 2, image: '/Menu/AmericanoSeries/Americano Hot.jpg', title: 'Hot Americano', price: '21.000', sold: 98, rating: 4, category: "Americano Series", badge: 'Terlaris', description: 'Kopi klasik dengan rasa pahit yang menyegarkan, cocok diminum kapan saja.',
        canChooseIce: false,
        reviews: [
            { user: "Budi", rating: 5, comment: "Enak banget", date: "2025-04-01" },
            { user: "Sari", rating: 4, comment: "Pas banget", date: "2025-03-30" },
        ]  },
    { id: 3, image: '/Menu/AmericanoSeries/Manuka Americano Iced.jpg', title: 'Iced Manuka Americano', price: '29.000', sold: 75, rating: 5, category: "Americano Series", badge: 'Promo',description: 'Kopi klasik dengan rasa pahit yang menyegarkan, cocok diminum kapan saja.',
        reviews: [
        ] },
    { id: 4, image: '/Menu/AmericanoSeries/Manuka Americano Hot.jpg', title: 'Hot Manuka Americano', price: '29.000', sold: 63, rating: 4, category: "Americano Series" , canChooseIce: false,},
    { id: 5, image: '/Menu/AmericanoSeries/Triple Peach Americano.jpg', title: 'Triple Peach Americano', price: '29.000', sold: 112, rating: 5, category: "Americano Series" },
    { id: 6, image: '/Menu/AmericanoSeries/Berry Manuka Americano.jpg', title: 'Berry Manuka Americano', price: '29.000', sold: 84, rating: 4, category: "Americano Series" },

    // Coffee
    { id: 7, image: '/Menu/CoffeSeries/Bumi Latte w Badge.jpg', title: 'Iced Bumi Latte', price: '24.000', sold: 200, rating: 5, category: "Coffee Series", badge: 'Baru' },
    { id: 8, image: '/Menu/CoffeSeries/Capucino Iced.jpg', title: 'Iced Cappuccino', price: '29.000', sold: 178, rating: 5, category: "Coffee Series" },
    { id: 9, image: '/Menu/CoffeSeries/Cappucino Hot.jpg', title: 'Hot Cappuccino', price: '29.000', sold: 150, rating: 5, category: "Coffee Series", canChooseIce: false, },
    { id: 10, image: '/Menu/CoffeSeries/Double Iced Shaken Latte.jpg', title: 'Double Iced Shaken Latte', price: '33.000', sold: 143, rating: 5, category: "Coffee Series" },
    { id: 11, image: '/Menu/CoffeSeries/Cafe Latte Iced.jpg', title: 'Iced Café Latte', price: '29.000', sold: 189, rating: 5, category: "Coffee Series" },
    { id: 12, image: '/Menu/CoffeSeries/Cafe Latte Hot.jpg', title: 'Hot Café Latte', price: '29.000', sold: 167, rating: 4, category: "Coffee Series",canChooseIce: false, },
    { id: 13, image: '/Menu/CoffeSeries/Nutty Oat Latte Iced.jpg', title: 'Nutty Oat Latte', price: '39.000', sold: 122, rating: 5, category: "Coffee Series" },
    { id: 14, image: '/Menu/CoffeSeries/Buttercream Tiramisu Latte.jpg', title: 'Iced Buttercream Tiramisu Latte', price: '33.000', sold: 95, rating: 5, category: "Coffee Series" },
    { id: 15, image: '/Menu/CoffeSeries/espresso173.jpg', title: 'Hot Espresso', price: '19.000', sold: 211, rating: 4, category: "Coffee Series" },
    { id: 16, image: '/Menu/CoffeSeries/Caramel Praline Macchiato Iced.jpg', title: 'Iced Caramel Praline Macchiato', price: '33.000', sold: 118, rating: 5, category: "Coffee Series" },
    { id: 17, image: '/Menu/CoffeSeries/Caramel Praline Macchiato Hot.jpg', title: 'Hot Caramel Praline Macchiato', price: '33.000', sold: 106, rating: 5, category: "Coffee Series", canChooseIce: false, },

    // Nusantara Series
    { id: 18, image: '/Menu/NusantaraSeries/ICED COD.jpg', title: 'Iced Aceh Gayo', price: '21.000', sold: 132, rating: 5, category: "Nusantara Series" },
    { id: 19, image: '/Menu/NusantaraSeries/COD_satuan-01.jpg', title: 'Hot Aceh Gayo', price: '21.000', sold: 118, rating: 4, category: "Nusantara Series", canChooseIce: false, },
    { id: 20, image: '/Menu/NusantaraSeries/ICED COD.jpg', title: 'Iced Toraja Sapan', price: '21.000', sold: 101, rating: 5, category: "Nusantara Series" },
    { id: 21, image: '/Menu/NusantaraSeries/COD_satuan-02.jpg', title: 'Hot Toraja Sapan', price: '21.000', sold: 86, rating: 4, category: "Nusantara Series", canChooseIce: false, },
    { id: 22, image: '/Menu/NusantaraSeries/ICED COD.jpg', title: 'Iced Bali Kintamani', price: '21.000', sold: 97, rating: 5, category: "Nusantara Series" },
    { id: 23, image: '/Menu/NusantaraSeries/COD_satuan-03.jpg', title: 'Hot Bali Kintamani', price: '21.000', sold: 79, rating: 4, category: "Nusantara Series", canChooseIce: false, },
    // FOREveryone 1L
    { id: 24, image: '/Menu/1L/cocopeach.jpg', title: 'Coco Peach Fusion 1L', price: '90.000', sold: 63, rating: 5, category: "FORCOFFEveryone 1L Series", badge: 'Terlaris' },
    { id: 25, image: '/Menu/1L/Kopi dari Tani - RTD.jpg', title: 'Kopi Dari Tani 1L', price: '84.000', sold: 58, rating: 5, category: "FORCOFFEveryone 1L Series", badge: 'Baru' },
    { id: 26, image: '/Menu/1L/Bumi Latte - RTD.jpg', title: 'Bumi Latte 1L', price: '84.000', sold: 72, rating: 5, category: "FORCOFFEveryone 1L Series", badge: 'Baru'},
    { id: 27, image: '/Menu/1L/DarkChoco.jpg', title: 'Dark Chocolate 1L', price: '95.000', sold: 47, rating: 5, category: "FORCOFFEveryone 1L Series" },
    { id: 28, image: '/Menu/1L/butterscotchssl1l1402.jpg', title: 'Butterscotch Sea Salt Latte 1L', price: '124.000', sold: 50, rating: 5, category: "FORCOFFEveryone 1L Series" },
    { id: 29, image: '/Menu/1L/ArenLatte1L3006.jpg', title: 'Aren Latte 1L', price: '90.000', sold: 80, rating: 5, category: "FORCOFFEveryone 1L Series" },
    { id: 30, image: '/Menu/1L/CaramelPralineMacchiato1L3006.jpg', title: 'Caramel Praline Macchiato 1L', price: '95.000', sold: 68, rating: 5, category: "FORCOFFEveryone 1L Series" },
    { id: 31, image: '/Menu/1L/pandanlatte1L3006.jpg', title: 'Pandan Latte 1L', price: '90.000', sold: 74, rating: 5, category: "FORCOFFEveryone 1L Series" },
    { id: 32, image: '/Menu/1L/latte1L3006.jpg', title: 'Café Latte 1L', price: '90.000', sold: 66, rating: 5, category: "FORCOFFEveryone 1L Series" },
    { id: 33, image: '/Menu/1L/1L-nutty-oat.jpg', title: 'Nutty Oat Latte 1L', price: '124.000', sold: 53, rating: 5, category: "FORCOFFEveryone 1L Series" },
    { id: 34, image: '/Menu/1L/RTD.jpg', title: 'Almond Choco 1L', price: '124.000', sold: 61, rating: 5, category: "FORCOFFEveryone 1L Series" },
    { id: 35, image: '/Menu/1L/matcha1L3006.jpg', title: 'Matcha Green Tea 1L', price: '95.000', sold: 59, rating: 5, category: "FORCOFFEveryone 1L Series" },

    // Fore Deli
    { id: 36, image: '/Menu/ForSnacks/Creamy Beef Mentai Sandwich.png', title: 'Beef Mentai Sandwich', price: '39.000', sold: 89, rating: 5, category: "Forcoffi Snacks" },
    { id: 37, image: '/Menu/ForSnacks/Cakalang Quiche.png', title: 'Cakalang Quiche', price: '36.000', sold: 53, rating: 5, category: "Forcoffi Snacks" },
    { id: 38, image: '/Menu/ForSnacks/Pain au Tiramisu.png', title: 'Pain au Tiramisu', price: '36.000', sold: 41, rating: 5, category: "Forcoffi Snacks" },
    { id: 39, image: '/Menu/ForSnacks/Strawberry Matcha Cake Zoomed.png', title: 'Matcha Strawberry Cake', price: '27.000', sold: 47, rating: 5, category: "Forcoffi Snacks" },
    { id: 40, image: '/Menu/ForSnacks/Mushroom Truffle Sandwich.png', title: 'Mushroom Truffle Sandwich', price: '42.000', sold: 69, rating: 5, category: "Forcoffi Snacks" },
    { id: 41, image: '/Menu/ForSnacks/Cheesy Tuna Sandwich.png', title: 'Cheesy Tuna Sandwich', price: '39.000', sold: 54, rating: 5, category: "Forcoffi Snacks" },
    { id: 42, image: '/Menu/ForSnacks/Chicken Teriyaki Sandwich.png', title: 'Chicken Teriyaki Sandwich', price: '39.000', sold: 77, rating: 5, category: "Forcoffi Snacks" },
    { id: 43, image: '/Menu/ForSnacks/Smoked Beef & Cheese Sandwich.png', title: 'Smoked Beef & Cheese Sandwich', price: '39.000', sold: 65, rating: 5, category: "Forcoffi Snacks" },
    { id: 44, image: '/Menu/ForSnacks/Blueberry Cheese Muffin.png', title: 'Blueberry Cheese Muffin', price: '36.000', sold: 49, rating: 5, category: "Forcoffi Snacks" },
    { id: 45, image: '/Menu/ForSnacks/Choco Melt Muffin.png', title: 'Choco Melt Muffin', price: '36.000', sold: 51, rating: 5, category: "Forcoffi Snacks" },
    { id: 46, image: '/Menu/ForSnacks/Smoked Beef _ Cheese Croissant.jpg', title: 'Smoked Beef & Cheese Croissant', price: '36.000', sold: 56, rating: 5, category: "Forcoffi Snacks" },
    { id: 47, image: '/Menu/ForSnacks/Triple Cheese Danish.jpg', title: 'Triple Cheese Danish', price: '33.000', sold: 44, rating: 5, category: "Forcoffi Snacks" },
    { id: 48, image: '/Menu/ForSnacks/Almond Croissant.jpg', title: 'Almond Croissant', price: '33.000', sold: 39, rating: 5, category: "Forcoffi Snacks" },
    { id: 49, image: '/Menu/ForSnacks/thumbbbb.jpg', title: 'Banana Chocolate Cake', price: '27.000', sold: 32, rating: 5, category: "Forcoffi Snacks" },
    { id: 50, image: '/Menu/ForSnacks/cempedak-80.jpg', title: 'Cempedak Cake', price: '27.000', sold: 25, rating: 5, category: "Forcoffi Snacks" },
    { id: 51, image: '/Menu/ForSnacks/Butter Croissant _-80.jpg', title: 'Butter Croissant', price: '24.000', sold: 47, rating: 5, category: "Forcoffi Snacks" },
    { id: 52, image: '/Menu/ForSnacks/painauchocolat2403.jpg', title: 'Pain au Chocolat', price: '29.000', sold: 37, rating: 5, category: "Forcoffi Snacks" },
    { id: 53, image: '/Menu/ForSnacks/Kouign amann-.jpg', title: 'Kouign-Amann', price: '29.000', sold: 33, rating: 5, category: "Forcoffi Snacks" },
    // Fore Signature
    { id: 54, image: '/Menu/Signature/Kopi dari Tani w Badge.jpg', title: 'Iced Kopi Dari Tani', price: '24.000', sold: 102, rating: 5, category: "Forcoffi Signature Series" },
    { id: 55, image: '/Menu/Signature/Kopi dari Tani w Badge.jpg', title: 'Iced Butterscotch Sea Salt Latte', price: '31.000', sold: 120, rating: 5, category: "Forcoffi Signature Series" },
    { id: 56, image: '/Menu/Signature/Buttercream Latte.jpg', title: 'Iced Buttercream Latte', price: '29.000', sold: 115, rating: 5, category: "Forcoffi Signature Series" },
    { id: 57, image: '/Menu/Signature/Aren Latte Ice.jpg', title: 'Iced Aren Latte', price: '29.000', sold: 133, rating: 5, category: "Forcoffi Signature Series" },
    { id: 58, image: '/Menu/Signature/Aren Latte Hot.jpg', title: 'Hot Aren Latte', price: '29.000', sold: 95, rating: 5, category: "Forcoffi Signature Series" },
    { id: 59, image: '/Menu/Signature/Pandan Latte Iced.jpg', title: 'Iced Pandan Latte', price: '29.000', sold: 99, rating: 5, category: "Forcoffi Signature Series" },
    { id: 60, image: '/Menu/Signature/Pandan Latte Hot.jpg', title: 'Hot Pandan Latte', price: '29.000', sold: 88, rating: 5, category: "Forcoffi Signature Series" },

    // Ice Blended
    { id: 61, image: '/Menu/Ice Blended/caramelpralinecoffee173.jpg', title: 'Caramel Praline Coffee Ice Blended', price: '33.000', sold: 87, rating: 5, category: "Ice Blended Series" },
    { id: 62, image: '/Menu/Ice Blended/matchablended173.jpg', title: 'Matcha Ice Blended', price: '33.000', sold: 99, rating: 5, category: "Ice Blended Series" },
    { id: 63, image: '/Menu/Ice Blended/strawberryblend173.jpg', title: 'Strawberry Ice Blended', price: '33.000', sold: 76, rating: 5, category: "Ice Blended Series" },
    { id: 64, image: '/Menu/Ice Blended/chocolateblend173.jpg', title: 'Chocolate Ice Blended', price: '33.000', sold: 89, rating: 5, category: "Ice Blended Series" },

    // Non Coffee
    { id: 65, image: '/Menu/NonCoffe/darkchocolate-01.jpg', title: 'Iced Dark Chocolate', price: '33.000', sold: 140, rating: 5, category: "Non Coffee Series" },
    { id: 66, image: '/Menu/NonCoffe/darkchocolate-02.jpg', title: 'Hot Dark Chocolate', price: '33.000', sold: 130, rating: 5, category: "Non Coffee Series" },
    { id: 67, image: '/Menu/NonCoffe/almondchocoiced173.jpg', title: 'Iced Almond Choco', price: '39.000', sold: 121, rating: 5, category: "Non Coffee Series" },
    { id: 68, image: '/Menu/NonCoffe/almondchocohot173.jpg', title: 'Hot Almond Choco', price: '39.000', sold: 110, rating: 5, category: "Non Coffee Series" },
    { id: 69, image: '/Menu/NonCoffe/matchagreentealatte173.jpg', title: 'Iced Matcha Green Tea', price: '33.000', sold: 112, rating: 5, category: "Non Coffee Series" },
    { id: 70, image: '/Menu/NonCoffe/matchagreeteahot173.jpg', title: 'Hot Matcha Green Tea', price: '33.000', sold: 103, rating: 5, category: "Non Coffee Series" },
    { id: 71, image: '/Menu/NonCoffe/classicmiloiced173.jpg', title: 'Iced Classic Milo', price: '24.000', sold: 150, rating: 5, category: "Non Coffee Series" },
    { id: 72, image: '/Menu/NonCoffe/classicmilohot173.jpg', title: 'Hot Classic Milo', price: '24.000', sold: 118, rating: 5, category: "Non Coffee Series" },

    // Refresher
    { id: 73, image: '/Menu/Refresher/Coco Peach Fusion (3).jpg', title: 'Iced Coco Peach Fusion', price: '29.000', sold: 105, rating: 5, category: "Refresher Series" },
    { id: 74, image: '/Menu/Refresher/hibiscuslychee173.jpg', title: 'Hibiscus Lychee Peach Yakult', price: '29.000', sold: 98, rating: 5, category: "Refresher Series" },
    { id: 75, image: '/Menu/Refresher/sunnycitrus173.jpg', title: 'Sunny Citrus Jasmine', price: '29.000', sold: 99, rating: 5, category: "Refresher Series" },

    // Tea
    { id: 76, image: '/Menu/Tea/englishbreakfasticed173.jpg', title: 'Iced English Breakfast', price: '29.000', sold: 77, rating: 5, category: "Tea Series" },
    { id: 77, image: '/Menu/Tea/englishbreakfast173.jpg', title: 'Hot English Breakfast', price: '29.000', sold: 69, rating: 5, category: "Tea Series" },
    { id: 78, image: '/Menu/Tea/greenteajasmineiced173.jpg', title: 'Iced Green Tea Jasmine', price: '29.000', sold: 74, rating: 5, category: "Tea Series" },
    { id: 79, image: '/Menu/Tea/greenteajasmine173.jpg', title: 'Hot Green Tea Jasmine', price: '29.000', sold: 65, rating: 5, category: "Tea Series" },
    { id: 80, image: '/Menu/Tea/purechamomileiced173.jpg', title: 'Iced Pure Chamomile', price: '29.000', sold: 63, rating: 5, category: "Tea Series" },
    { id: 81, image: '/Menu/Tea/purechamomile173.jpg', title: 'Hot Pure Chamomile', price: '29.000', sold: 58, rating: 5, category: "Tea Series" },
    { id: 82, image: '/Menu/Tea/cremecaramelteaiced173.jpg', title: 'Iced Creme Caramel Tea', price: '29.000', sold: 70, rating: 5, category: "Tea Series" },
    { id: 83, image: '/Menu/Tea/cremecarameltea173.jpg', title: 'Hot Creme Caramel Tea', price: '29.000', sold: 61, rating: 5, category: "Tea Series" },
    { id: 84, image: '/Menu/Tea/greenteaminticed173.jpg', title: 'Iced Green Tea Mint', price: '29.000', sold: 65, rating: 5, category: "Tea Series" },
    { id: 85, image: '/Menu/Tea/greenteamint173.jpg', title: 'Hot Green Tea Mint', price: '29.000', sold: 59, rating: 5, category: "Tea Series" },
]

export const categories = [
    "Americano Series",
    "Coffee Series",
    "Nusantara Series",
    "FORCOFFEveryone 1L Series",
    "Forcoffi Snacks",
    "Forcoffi Signature Series",
    "Ice Blended Series",
    "Non Coffee Series",
    "Refresher Series",
    "Tea Series"
];

export const pickupSuggestions = [
    "Forcoffi Ijen Nirwana",
    "Forcoffi Dieng",
    "Forcoffi Soekarno Hatta",
    "Forcoffi Sigura-Gura",
    "Forcoffi Lowokwaru",
    "Forcoffi Dinoyo",
    "Forcoffi Tlogomas",
    "Forcoffi Sawojajar",
    "Forcoffi Madyopuro",
    "Forcoffi Malang Town Square (MATOS)",
    "Forcoffi Universitas Brawijaya",
    "Forcoffi Universitas Negeri Malang",
    "Forcoffi Malang City Point",
  ];
  