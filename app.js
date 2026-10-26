"use strict";

const API_BASE = "https://dummyjson.com/products";
const FALLBACK_CARS = [
  { id: 91001, title: "Apex GT Coupe", brand: "Apex", description: "Güçlü motoru ve sportif tasarımıyla uzun yol ve şehir sürüşleri için premium coupe.", category: "vehicle", price: 720, rating: 4.9, thumbnail: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80" },
  { id: 91002, title: "Velox R8 Sport", brand: "Velox", description: "Keskin çizgiler, yüksek performans ve konforlu bir kokpit tek otomobilde buluşuyor.", category: "vehicle", price: 640, rating: 4.8, thumbnail: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80" },
  { id: 91003, title: "Monza Executive", brand: "Monza", description: "Şık iç mekânı ve dengeli sürüşüyle özel günleriniz için lüks sedan.", category: "vehicle", price: 560, rating: 4.7, thumbnail: "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=900&q=80" },
  { id: 92001, title: "Falcon RR 1000", brand: "Falcon", description: "Yarış pistinden ilham alan aerodinamik gövde ve heyecan verici iki teker deneyimi.", category: "motorcycle", price: 420, rating: 4.9, thumbnail: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80" },
  { id: 92002, title: "Vortex Street 750", brand: "Vortex", description: "Çevik, güçlü ve şehir içinde olduğu kadar açık yolda da keyifli motosiklet.", category: "motorcycle", price: 350, rating: 4.6, thumbnail: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80" },
  { id: 92003, title: "Nomad Touring", brand: "Nomad", description: "Konforlu oturuşu ve geniş menziliyle uzun maceralar için touring motosikleti.", category: "motorcycle", price: 390, rating: 4.8, thumbnail: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=900&q=80" }
];

let gelenAraclar = [];
let aktifTur = "vehicle";
let garajListesi = guvenliGarajOku();
let indirimOrani = 1;
let seciliArac = null;

function guvenliGarajOku() {
  try {
    const kayit = JSON.parse(localStorage.getItem("siberGaraj") || "[]");
    return Array.isArray(kayit) ? kayit.filter(arac => arac && Number.isFinite(arac.id)) : [];
  } catch (_) { return []; }
}

$(function () {
  $("#kampanyaBtn").on("click", () => $("#kuponKutusu").slideToggle(3000));
  sayaciGuncelle();
  if (document.getElementById("arac-listesi")) araclariGetir("vehicle");
  if (document.getElementById("garajTabloGovdesi")) garajTablosunuCiz();
});

async function araclariGetir(tur) {
  aktifTur = tur;
  const durum = document.getElementById("apiDurum");
  if (durum) durum.textContent = "Araçlar yükleniyor…";
  try {
    const kategori = tur === "motorcycle" ? "motorcycle" : "vehicle";
    const yanit = await fetch(`${API_BASE}/category/${kategori}?limit=12`);
    if (!yanit.ok) throw new Error("API yanıt vermedi");
    const veri = await yanit.json();
    const apiAraclari = Array.isArray(veri.products) ? veri.products : [];
    gelenAraclar = apiAraclari.length ? apiAraclari.map(arac => ({ ...arac, category: kategori })) : FALLBACK_CARS.filter(arac => arac.category === kategori);
    if (durum) durum.textContent = apiAraclari.length ? "Canlı araç kataloğu" : "Örnek araçlar gösteriliyor.";
  } catch (_) {
    gelenAraclar = FALLBACK_CARS.filter(arac => arac.category === tur);
    if (durum) durum.textContent = "Canlı katalog şu an kullanılamıyor; örnek araçlar gösteriliyor.";
  }
  vitrineDiz(gelenAraclar.filter(arac => arac.category === tur));
}

function vitrineDiz(araclar) {
  const alan = $("#arac-listesi");
  if (!alan.length) return;
  alan.empty();
  if (!araclar.length) {
    alan.html('<div class="col-12"><div class="alert alert-secondary">Aramanızla eşleşen araç bulunamadı.</div></div>');
    return;
  }
  araclar.forEach(arac => {
    const gunlukKira = gunlukFiyat(arac);
    const baslik = htmlGuvenli(arac.title || "VIP araç");
    const resim = htmlGuvenli(arac.thumbnail || "");
    const aciklama = htmlGuvenli((arac.description || "Özel araç filomuzu keşfedin.").slice(0, 96));
    const kart = `<div class="col-12 col-md-6 col-lg-3"><article class="card vehicle-card"><div class="vehicle-image-wrap"><img src="${resim}" alt="${baslik}" loading="lazy"><span class="badge text-bg-warning price-badge">$${gunlukKira} / Gün</span></div><div class="card-body d-flex flex-column"><h3 class="h5 text-warning fw-bold">${baslik}</h3><p class="text-secondary small flex-grow-1">${aciklama}</p><div class="d-grid gap-2 mt-2"><button onclick="modalAc(${Number(arac.id)})" class="btn btn-outline-info btn-sm"><i class="fa-solid fa-magnifying-glass"></i> Detaylı incele</button><button onclick="garajaEkle(${Number(arac.id)})" class="btn btn-warning btn-sm fw-bold"><i class="fa-solid fa-plus"></i> Garaja ekle</button></div></div></article></div>`;
    alan.append(kart);
  });
}

function aramaYap() {
  const arama = (document.getElementById("aracAra")?.value || "").trim().toLocaleLowerCase("tr-TR");
  const eslesenler = gelenAraclar.filter(arac => (arac.title || "").toLocaleLowerCase("tr-TR").includes(arama));
  vitrineDiz(eslesenler);
}

function gunlukFiyat(arac) { return Math.max(50, Math.round((Number(arac.price) || 0) / 150) + 50); }

function modalAc(aracId) {
  const arac = gelenAraclar.find(item => Number(item.id) === Number(aracId));
  if (!arac) return;
  seciliArac = arac;
  $("#modalBaslik").text(arac.title || "VIP araç");
  $("#modalResim").attr({ src: arac.thumbnail || "", alt: arac.title || "Araç" });
  $("#modalAciklama").text(arac.description || "Özel araç filomuzu keşfedin.");
  $("#modalMarka").text(arac.brand || "VIP Özel");
  $("#modalPuan").text(arac.rating ?? "—");
  $("#modalFiyat").text(`$${gunlukFiyat(arac)}`);
  $("#modalKiralaBtn").off("click").on("click", () => {
    garajaEkle(arac.id);
    bootstrap.Modal.getOrCreateInstance(document.getElementById("aracDetayModal")).hide();
  });
  bootstrap.Modal.getOrCreateInstance(document.getElementById("aracDetayModal")).show();
}

function garajaEkle(aracId) {
  const arac = gelenAraclar.find(item => Number(item.id) === Number(aracId));
  if (!arac) return;
  const mevcut = garajListesi.find(item => Number(item.id) === Number(aracId));
  if (mevcut) mevcut.gun += 1;
  else garajListesi.push({ id: Number(arac.id), baslik: arac.title || "VIP araç", resim: arac.thumbnail || "", gunlukUcret: gunlukFiyat(arac), gun: 1, tur: arac.category || aktifTur });
  garajiKaydet();
  sayaciGuncelle();
  garajTablosunuCiz();
}

function garajiKaydet() { localStorage.setItem("siberGaraj", JSON.stringify(garajListesi)); }
function sayaciGuncelle() { $("#garajSayaci").text(garajListesi.length); }

function garajTablosunuCiz() {
  const tablo = document.getElementById("garajTabloGovdesi");
  if (!tablo) return;
  const govde = $(tablo).empty();
  let toplamTutar = 0;
  if (!garajListesi.length) {
    govde.html('<tr><td colspan="6" class="py-4 text-secondary">Garajınız boş. Vitrinden bir araç seçebilirsiniz.</td></tr>');
  } else {
    garajListesi.forEach((arac, index) => {
      const araToplam = (Number(arac.gunlukUcret) || 0) * Math.max(1, Number(arac.gun) || 1);
      toplamTutar += araToplam;
      const satir = `<tr id="satir-${index}"><td><img src="${htmlGuvenli(arac.resim || "")}" alt="${htmlGuvenli(arac.baslik)}" width="76" height="54" class="rounded object-fit-cover"></td><td class="fw-bold">${htmlGuvenli(arac.baslik)}</td><td>$${Number(arac.gunlukUcret) || 0}</td><td><button onclick="gunDegistir(${index},-1)" class="btn btn-sm btn-secondary" aria-label="Gün azalt">−</button><span class="mx-2 fw-bold">${Math.max(1, Number(arac.gun) || 1)} gün</span><button onclick="gunDegistir(${index},1)" class="btn btn-sm btn-secondary" aria-label="Gün artır">+</button></td><td class="fw-bold">$${araToplam}</td><td><button onclick="aracSil(${index})" class="btn btn-sm btn-danger" aria-label="Aracı sil"><i class="fa-solid fa-trash"></i></button></td></tr>`;
      govde.append(satir);
    });
  }
  const teslimat = $("#vipTeslimat").prop("checked") ? 100 : 0;
  const indirimliToplam = Math.round((toplamTutar + teslimat) * indirimOrani);
  $("#genelToplamText").text(`$${indirimliToplam}`);
}

function gunDegistir(index, miktar) {
  const arac = garajListesi[index];
  if (!arac) return;
  arac.gun = (Number(arac.gun) || 1) + miktar;
  if (arac.gun <= 0) { aracSil(index); return; }
  garajiKaydet();
  garajTablosunuCiz();
}

function aracSil(index) {
  const satir = $(`#satir-${index}`);
  if (!satir.length) return;
  satir.fadeOut(400, function () {
    garajListesi.splice(index, 1);
    garajiKaydet();
    garajTablosunuCiz();
    sayaciGuncelle();
  });
}

function garajiTemizle() {
  garajListesi = [];
  localStorage.removeItem("siberGaraj");
  garajTablosunuCiz();
  sayaciGuncelle();
}

function kuponUygula() {
  const girilenKod = String($("#kuponInput").val() || "").trim().toLocaleUpperCase("tr-TR");
  if (girilenKod === "VIPGARAJ20") {
    indirimOrani = 0.8;
    $("#kuponMesaj").html('<div class="alert alert-success py-1 small">✅ %20 VIP indirimi uygulandı.</div>');
    $("#genelToplamText").css({ color: "#ffc107", "font-size": "40px" });
  } else {
    indirimOrani = 1;
    $("#kuponMesaj").html('<div class="alert alert-danger py-1 small">❌ Geçersiz kupon kodu.</div>');
    $("#genelToplamText").css({ color: "", "font-size": "" });
  }
  garajTablosunuCiz();
}

function rezervasyonTamamla(olay) {
  olay.preventDefault();
  const ad = String($("#surucuAd").val() || "").trim();
  const yas = Number.parseInt($("#surucuYas").val(), 10);
  const ehliyet = $("#ehliyetSinifi").val();
  const sube = $("#subeSecim").val();
  const uyari = $("#formUyariKutusu");
  const mesajGoster = (stil, icerik) => uyari.hide().html(`<div class="alert alert-${stil}">${icerik}</div>`).fadeIn(400);
  if (!Number.isFinite(yas) || yas < 21) { mesajGoster("danger", "VIP araç kiralamak için en az 21 yaşında olmalısınız."); return; }
  if (!garajListesi.length) { mesajGoster("warning", 'Garajınızda araç yok. <a href="index.html" class="alert-link">Önce araç seçin.</a>'); return; }
  const motosikletVar = garajListesi.some(arac => arac.tur === "motorcycle");
  const otomobilVar = garajListesi.some(arac => arac.tur !== "motorcycle");
  if ((motosikletVar && !["A", "A+B"].includes(ehliyet)) || (otomobilVar && !["B", "A+B"].includes(ehliyet))) {
    mesajGoster("warning", "Seçtiğiniz araç türü için ehliyet sınıfınız uygun değil. Otomobil için B, motosiklet için A sınıfı gerekir."); return;
  }
  mesajGoster("success", `🎉 Sayın <strong>${htmlGuvenli(ad)}</strong>, rezervasyonunuz onaylandı. Araçlarınız <strong>${htmlGuvenli(sube)}</strong> noktasında hazırlanıyor.`);
  window.setTimeout(() => { garajiTemizle(); window.location.href = "index.html"; }, 3500);
}

function htmlGuvenli(deger) {
  return String(deger).replace(/[&<>"']/g, karakter => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[karakter]);
}
