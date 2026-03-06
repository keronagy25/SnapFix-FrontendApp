export interface Provider {
  id:          string;
  name:        string;
  profession:  string;
  rating:      number;
  jobs:        number;
  price:       number;
  priceLabel:  string;
  serviceId:   string;
  avatar:      string;
  avatarColor: string;
  badge:       string;
  about:       string;
}

export const PROVIDERS: Provider[] = [
  { id:"1", name:"Ahmed Samy",   profession:"Electrician",   rating:4.9, jobs:312, price:150, priceLabel:"150 EGP/hr", serviceId:"electrical", avatar:"AS", avatarColor:"#F59E0B", badge:"Top Rated",     about:"10 years experience. Specializes in residential wiring and panel upgrades." },
  { id:"2", name:"Mohamed Ali",  profession:"Plumber",       rating:4.8, jobs:205, price:120, priceLabel:"120 EGP/hr", serviceId:"plumbing",   avatar:"MA", avatarColor:"#3B82F6", badge:"Fast Response", about:"8 years experience. Expert in leak detection and pipe installations." },
  { id:"3", name:"Karim Hassan", profession:"AC Technician", rating:4.7, jobs:178, price:200, priceLabel:"200 EGP/hr", serviceId:"ac",         avatar:"KH", avatarColor:"#06B6D4", badge:"Verified Pro",  about:"Certified HVAC technician. All major AC brands." },
  { id:"4", name:"Omar Farouk",  profession:"Painter",       rating:4.6, jobs:140, price:100, priceLabel:"100 EGP/hr", serviceId:"painting",   avatar:"OF", avatarColor:"#8B5CF6", badge:"Top Rated",     about:"Creative painter, 7 years interior & exterior." },
  { id:"5", name:"Youssef Nour", profession:"Carpenter",     rating:4.8, jobs:190, price:130, priceLabel:"130 EGP/hr", serviceId:"carpentry",  avatar:"YN", avatarColor:"#EC4899", badge:"Verified Pro",  about:"Skilled carpenter for furniture and custom woodwork." },
  { id:"6", name:"Tarek Saad",   profession:"Pest Control",  rating:4.5, jobs:98,  price:180, priceLabel:"180 EGP/hr", serviceId:"pest",       avatar:"TS", avatarColor:"#EF4444", badge:"Fast Response", about:"Specializes in emergency plumbing and drain services." },
  { id:"7", name:"Hany Morsi",   profession:"Plumber",       rating:4.6, jobs:134, price:110, priceLabel:"110 EGP/hr", serviceId:"plumbing",   avatar:"HM", avatarColor:"#0EA5E9", badge:"Verified Pro",  about:"Specializes in emergency plumbing and bathroom renovations." },
  { id:"8", name:"Sameh Fathy",  profession:"Electrician",   rating:4.7, jobs:210, price:160, priceLabel:"160 EGP/hr", serviceId:"electrical", avatar:"SF", avatarColor:"#D97706", badge:"Fast Response", about:"Commercial and residential electrician with 12 years experience." },
];