var SEED_PRODUCTS = [
  {
    "id": 1,
    "name": "لاب برجر",
    "brand": "",
    "category": "برجر لحم",
    "description": "150 غم لحم بقري، خس، بندورة، بصل، صوص لاب، جبنة شيدر.",
    "sizes": [
      {
        "size": "ساندويش",
        "unit": "قطعة",
        "price": 23
      },
      {
        "size": "وجبة",
        "unit": "قطعة",
        "price": 30
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop",
    "status": "bestseller"
  },
  {
    "id": 2,
    "name": "دبل لاب برجر",
    "brand": "",
    "category": "برجر لحم",
    "description": "300 غم لحم بقري، خس، بندورة، بصل، صوص لاب، 2 جبنة شيدر.",
    "sizes": [
      {
        "size": "ساندويش",
        "unit": "قطعة",
        "price": 33
      },
      {
        "size": "وجبة",
        "unit": "قطعة",
        "price": 40
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=400&fit=crop",
    "status": "special"
  },
  {
    "id": 3,
    "name": "هالبينو برجر",
    "brand": "",
    "category": "برجر لحم",
    "description": "150 غم لحم بقري، خس، بندورة، بصل، صوص لاب حار، هالبينو.",
    "sizes": [
      {
        "size": "ساندويش",
        "unit": "قطعة",
        "price": 25
      },
      {
        "size": "وجبة",
        "unit": "قطعة",
        "price": 32
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1586816001966-79b736744398?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 4,
    "name": "باربيكيو برجر",
    "brand": "",
    "category": "برجر لحم",
    "description": "150 غم لحم بقري، خس، بندورة، بصل مكرمل، صوص باربيكيو، صوص لاب.",
    "sizes": [
      {
        "size": "ساندويش",
        "unit": "قطعة",
        "price": 25
      },
      {
        "size": "وجبة",
        "unit": "قطعة",
        "price": 32
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 5,
    "name": "تشيز برجر",
    "brand": "",
    "category": "برجر لحم",
    "description": "150 غم لحم بقري، خس، بندورة، بصل، صوص لاب، شيدر، موزاريلا.",
    "sizes": [
      {
        "size": "ساندويش",
        "unit": "قطعة",
        "price": 25
      },
      {
        "size": "وجبة",
        "unit": "قطعة",
        "price": 32
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=400&fit=crop",
    "status": "bestseller"
  },
  {
    "id": 6,
    "name": "دبل تشيز برجر",
    "brand": "",
    "category": "برجر لحم",
    "description": "300 غم لحم بقري، خس، بندورة، بصل، صوص لاب، شيدر، موزاريلا.",
    "sizes": [
      {
        "size": "ساندويش",
        "unit": "قطعة",
        "price": 35
      },
      {
        "size": "وجبة",
        "unit": "قطعة",
        "price": 42
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=400&h=400&fit=crop",
    "status": "special"
  },
  {
    "id": 7,
    "name": "سماشد برجر",
    "brand": "",
    "category": "برجر لحم",
    "description": "200 غم لحم بقري، خس، بندورة، بصل، 2 شيدر، صوص لاب.",
    "sizes": [
      {
        "size": "ساندويش",
        "unit": "قطعة",
        "price": 28
      },
      {
        "size": "وجبة",
        "unit": "قطعة",
        "price": 35
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&h=400&fit=crop",
    "status": "bestseller"
  },
  {
    "id": 8,
    "name": "ماشروم وايت صوص",
    "brand": "",
    "category": "برجر لحم",
    "description": "150 غم لحم بقري، خس، بندورة، بصل، وايت صوص، فطر طازج.",
    "sizes": [
      {
        "size": "ساندويش",
        "unit": "قطعة",
        "price": 30
      },
      {
        "size": "وجبة",
        "unit": "قطعة",
        "price": 35
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 9,
    "name": "برجريتو",
    "brand": "",
    "category": "برجر لحم",
    "description": "خبز تورتيلا، 150 غم لحم بقري، خس، بندورة، صوص لاب، جبنة شيدر.",
    "sizes": [
      {
        "size": "ساندويش",
        "unit": "قطعة",
        "price": 23
      },
      {
        "size": "وجبة",
        "unit": "قطعة",
        "price": 30
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1610440042657-612c34d95e9f?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 10,
    "name": "تشكن برجر",
    "brand": "",
    "category": "برجر دجاج",
    "description": "دجاج كريسبي، خس، بندورة، صوص خاص.",
    "sizes": [
      {
        "size": "ساندويش",
        "unit": "قطعة",
        "price": 18
      },
      {
        "size": "وجبة",
        "unit": "قطعة",
        "price": 26
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&h=400&fit=crop",
    "status": "bestseller"
  },
  {
    "id": 11,
    "name": "تشكن راب",
    "brand": "",
    "category": "برجر دجاج",
    "description": "دجاج كريسبي، تورتيلا، خس، بندورة، صوص رانش.",
    "sizes": [
      {
        "size": "ساندويش",
        "unit": "قطعة",
        "price": 13
      },
      {
        "size": "وجبة",
        "unit": "قطعة",
        "price": 21
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 12,
    "name": "لاب تشكن",
    "brand": "",
    "category": "برجر دجاج",
    "description": "دجاج كريسبي، خبز بيتا، خس، بندورة، صوص لاب، صوص خاص.",
    "sizes": [
      {
        "size": "ساندويش",
        "unit": "قطعة",
        "price": 21
      },
      {
        "size": "وجبة",
        "unit": "قطعة",
        "price": 29
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=400&fit=crop",
    "status": "special"
  },
  {
    "id": 13,
    "name": "بافلو تشكن",
    "brand": "",
    "category": "برجر دجاج",
    "description": "دجاج كريسبي، خس، بندورة، صوص خاص، صوص بافلو حار.",
    "sizes": [
      {
        "size": "ساندويش",
        "unit": "قطعة",
        "price": 20
      },
      {
        "size": "وجبة",
        "unit": "قطعة",
        "price": 28
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 14,
    "name": "جريلد تشكن",
    "brand": "",
    "category": "برجر دجاج",
    "description": "دجاج مشوي، خبز بيتا، خس، بندورة، صوص لاب، صوص خاص.",
    "sizes": [
      {
        "size": "ساندويش",
        "unit": "قطعة",
        "price": 20
      },
      {
        "size": "وجبة",
        "unit": "قطعة",
        "price": 28
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1608039755401-742074f0548d?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 15,
    "name": "وايت صوص جريلد تشكين",
    "brand": "",
    "category": "برجر دجاج",
    "description": "دجاج مشوي، خبز بيتا، خس، بندورة، وايت صوص.",
    "sizes": [
      {
        "size": "ساندويش",
        "unit": "قطعة",
        "price": 22
      },
      {
        "size": "وجبة",
        "unit": "قطعة",
        "price": 30
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 17,
    "name": "سولو ميل",
    "brand": "",
    "category": "تندر دجاج",
    "description": "5 قطع دجاج كريسبي، خبز، صوصات، بطاطا، مشروب بارد.",
    "sizes": [
      {
        "size": "عادي",
        "unit": "قطعة",
        "price": 28
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1562967914-608f82629710?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 18,
    "name": "تربل ميل",
    "brand": "",
    "category": "تندر دجاج",
    "description": "15 قطعة دجاج كريسبي، 3 خبزات، 3 بطاطا، صوصات، 3 مشروبات باردة.",
    "sizes": [
      {
        "size": "عادي",
        "unit": "قطعة",
        "price": 75
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=400&h=400&fit=crop",
    "status": "special"
  },
  {
    "id": 19,
    "name": "فاميلي ميل",
    "brand": "",
    "category": "تندر دجاج",
    "description": "20 قطعة دجاج كريسبي، 4 خبزات، 4 بطاطا، مشروب عائلي كبير، صوصات.",
    "sizes": [
      {
        "size": "عادي",
        "unit": "قطعة",
        "price": 100
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop",
    "status": "special"
  },
  {
    "id": 20,
    "name": "بيف برجر",
    "brand": "",
    "category": "أطفال",
    "description": "برجر لحم للأطفال، خس، بندورة، صوص لاب.",
    "sizes": [
      {
        "size": "ساندويش",
        "unit": "قطعة",
        "price": 10
      },
      {
        "size": "وجبة",
        "unit": "قطعة",
        "price": 15
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1598182198871-d3f4ab4fd181?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 21,
    "name": "تشكن برجر كيدز",
    "brand": "",
    "category": "أطفال",
    "description": "برجر دجاج كريسبي للأطفال، خس، صوص خاص.",
    "sizes": [
      {
        "size": "ساندويش",
        "unit": "قطعة",
        "price": 10
      },
      {
        "size": "وجبة",
        "unit": "قطعة",
        "price": 15
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1615297928064-24977384d0da?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 22,
    "name": "تشكن كيدز",
    "brand": "",
    "category": "أطفال",
    "description": "2 قطعة دجاج كريسبي، خبز، صوصات، بطاطا صغيرة.",
    "sizes": [
      {
        "size": "عادي",
        "unit": "قطعة",
        "price": 15
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 23,
    "name": "بطاطا",
    "brand": "",
    "category": "إضافات",
    "description": "بطاطا مقلية طازجة ومقرمشة.",
    "sizes": [
      {
        "size": "عادي",
        "unit": "قطعة",
        "price": 7
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 24,
    "name": "حلقات بصل",
    "brand": "",
    "category": "إضافات",
    "description": "6 قطع حلقات بصل مقرمشة.",
    "sizes": [
      {
        "size": "عادي",
        "unit": "قطعة",
        "price": 10
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 25,
    "name": "قطعة لحم 150 غم",
    "brand": "",
    "category": "إضافات",
    "description": "قطعة لحم بقري إضافية بوزن 150 غم.",
    "sizes": [
      {
        "size": "عادي",
        "unit": "قطعة",
        "price": 11
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1547584370-2cc98b8b8dc8?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 26,
    "name": "اصابع موزاريلا",
    "brand": "",
    "category": "إضافات",
    "description": "3 قطع أصابع موزاريلا ذهبية.",
    "sizes": [
      {
        "size": "عادي",
        "unit": "قطعة",
        "price": 10
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1548340748-6d2b7d7da280?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 27,
    "name": "جبنة تشيدر",
    "brand": "",
    "category": "إضافات",
    "description": "شريحة جبنة تشيدر إضافية.",
    "sizes": [
      {
        "size": "عادي",
        "unit": "قطعة",
        "price": 3
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 28,
    "name": "بطاطا كيرلي",
    "brand": "",
    "category": "إضافات",
    "description": "بطاطا كيرلي مقرمشة ومتبهرة.",
    "sizes": [
      {
        "size": "عادي",
        "unit": "قطعة",
        "price": 10
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 29,
    "name": "كرات بطاطا",
    "brand": "",
    "category": "إضافات",
    "description": "كرات بطاطا ذهبية ومقرمشة.",
    "sizes": [
      {
        "size": "عادي",
        "unit": "قطعة",
        "price": 5
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 30,
    "name": "خبزة",
    "brand": "",
    "category": "إضافات",
    "description": "خبزة إضافية طازجة.",
    "sizes": [
      {
        "size": "عادي",
        "unit": "قطعة",
        "price": 1
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 31,
    "name": "سلطة سيزر",
    "brand": "",
    "category": "سلطات",
    "description": "سلطة سيزر طازجة بصوص السيزر.",
    "sizes": [
      {
        "size": "عادي",
        "unit": "قطعة",
        "price": 15
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 32,
    "name": "سلطة لاب",
    "brand": "",
    "category": "سلطات",
    "description": "سلطة لاب المشكلة بالخضار الطازجة.",
    "sizes": [
      {
        "size": "عادي",
        "unit": "قطعة",
        "price": 15
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 33,
    "name": "ماك اند تشيز",
    "brand": "",
    "category": "سلطات",
    "description": "ماك اند تشيز كريمي وغني بالجبنة.",
    "sizes": [
      {
        "size": "عادي",
        "unit": "قطعة",
        "price": 20
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=400&h=400&fit=crop",
    "status": "special"
  },
  {
    "id": 34,
    "name": "كولا",
    "brand": "",
    "category": "مشروبات",
    "description": "مشروب كولا بارد.",
    "sizes": [
      {
        "size": "عادي",
        "unit": "قطعة",
        "price": 2
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 35,
    "name": "عصير",
    "brand": "",
    "category": "مشروبات",
    "description": "عصير بارد منعش.",
    "sizes": [
      {
        "size": "عادي",
        "unit": "قطعة",
        "price": 3
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 36,
    "name": "عصير أطفال",
    "brand": "",
    "category": "مشروبات",
    "description": "عصير أطفال صغير.",
    "sizes": [
      {
        "size": "عادي",
        "unit": "قطعة",
        "price": 2
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1600271886742-f049cd5bba3f?w=400&h=400&fit=crop",
    "status": "normal"
  },
  {
    "id": 37,
    "name": "ماء",
    "brand": "",
    "category": "مشروبات",
    "description": "عبوة ماء باردة.",
    "sizes": [
      {
        "size": "عادي",
        "unit": "قطعة",
        "price": 2
      }
    ],
    "discount": 0,
    "image": "https://images.unsplash.com/photo-1564419320461-6870880221ad?w=400&h=400&fit=crop",
    "status": "normal"
  }
];

var SEED_SETTINGS = {
  "whatsappNumber": "972569236758",
  "heroSubtitle": "أطعم برجر بالبلد",
  "aboutText": "برجر لاب يقدّم برجر لحم ودجاج بطعم قوي ومكونات طازجة يومياً.\n\nنحضّر الساندويشات والوجبات بسرعة، ونهتم بالتفاصيل من أول قضمة لآخر صوص.\n\nلطلبات داخل المطعم أو سفري، إحنا جاهزين.",
  "instagramLink": "https://www.instagram.com/burger._.lab/",
  "tiktokLink": ""
};

function seedFirestoreData(force) {
    if (!window.db) return Promise.reject(new Error('Firebase not ready'));
    var productsRef = db.collection('products');
    var settingsRef = db.collection('settings').doc('config');

    function clearColl(ref) {
        return ref.get().then(function(snap) {
            if (snap.empty) return;
            var batch = db.batch();
            snap.forEach(function(d) { batch.delete(d.ref); });
            return batch.commit();
        });
    }

    function writeSeed() {
        var batch = db.batch();
        for (var i = 0; i < SEED_PRODUCTS.length; i++) {
            batch.set(productsRef.doc(String(SEED_PRODUCTS[i].id)), SEED_PRODUCTS[i]);
        }
        batch.set(settingsRef, SEED_SETTINGS, { merge: true });
        return batch.commit().then(function() {
            return { seeded: true, products: SEED_PRODUCTS.length };
        });
    }

    if (force) {
        return clearColl(productsRef).then(writeSeed);
    }
    return productsRef.limit(1).get().then(function(snap) {
        if (!snap.empty) return { seeded: false, reason: 'not-empty' };
        return writeSeed();
    });
}
window.seedFirestoreData = seedFirestoreData;
