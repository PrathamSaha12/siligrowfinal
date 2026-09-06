function toggleMenu(open){
    document.getElementById('mobileMenu').classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  // Small pointer movement for the hero visual on larger screens.
  const visual = document.querySelector('.visual');
  if (window.matchMedia('(pointer:fine)').matches) {
    document.addEventListener('mousemove', e => {
      const x = (e.clientX / window.innerWidth - .5) * 8;
      const y = (e.clientY / window.innerHeight - .5) * 8;
      visual.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

// ===== Section ===== 

// ===== Section ===== 

const services = [
  { title:"SEO Optimisation",              img:"Slide 2.png" },
  { title:"Graphic Design",                img:"Slide 3.png" },
  { title:"Social Media Management",       img:"Slide 4.png" },
  { title:"Content Marketing Strategy",    img:"Slide 5.png" },
  { title:"Web Design & Development",      img:"Slide 6.png" },
  { title:"Performance Marketing",         img:"Slide 7.png" }
];

/* Desktop / laptop grid — same services, same imagery and accent
   colours as the phone deck, laid out as cards with a scroll-in
   reveal instead of a swipe. */
(function(){
  const grid=document.getElementById("servicesGrid");
  if(!grid) return;

  grid.innerHTML="";
  services.forEach((service,i)=>{
    const card=document.createElement("article");
    card.className="service-card";
    card.style.transitionDelay=(i*70)+"ms";

    card.innerHTML=`
      <div class="service-card-media">
        <img src="${service.img}" alt="${service.title}" loading="lazy">
      </div>
      <div class="service-card-body">
        <span class="service-card-title">${service.title}</span>
        <span class="service-card-arrow">↗</span>
      </div>
      <span class="service-card-num">${String(i+1).padStart(2,"0")}</span>
    `;

    grid.appendChild(card);
  });

  const cards=grid.querySelectorAll(".service-card");
  const gridObs=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add("show");
        gridObs.unobserve(entry.target);
      }
    });
  },{threshold:.15});

  cards.forEach(card=>gridObs.observe(card));
})();

/* Mobile carousel — finger-swipe slide, arrow buttons, autoplay when idle.
   Only needed below the desktop breakpoint, where the grid above takes over. */
if(window.matchMedia("(min-width:901px)").matches){
  // Desktop: nothing further to wire up for the deck.
}else{
const deck=document.getElementById("deck");
const deckTrack=document.getElementById("deckTrack");
const counter=document.getElementById("deckCounter");
const total=services.length;

/* Extended track: [clone of last, ...real slides..., clone of first]
   lets the slide loop endlessly while still animating a plain
   left/right slide instead of jumping. */
function createCard(service,index){
  const card=document.createElement("article");
  card.className="deck-card";
  card.dataset.index=index;

  card.innerHTML=`
    <img src="${service.img}" alt="${service.title}" draggable="false">
  `;

  return card;
}

function buildTrack(){
  deckTrack.innerHTML="";
  deckTrack.appendChild(createCard(services[total-1],total-1));
  services.forEach((s,i)=>deckTrack.appendChild(createCard(s,i)));
  deckTrack.appendChild(createCard(services[0],0));
}

let pos=1;              /* position within the extended track */
let realCurrent=0;
let isAnimating=false;
let isDragging=false;
let dragStartX=0;
let dragDelta=0;
let deckWidth=0;
let autoplayTimer=null;

function setTrack(withTransition,extraPx){
  deckTrack.style.transition=withTransition?"transform .5s cubic-bezier(.22,.8,.32,1)":"none";
  const offset=extraPx?` + ${extraPx}px`:"";
  deckTrack.style.transform=`translateX(calc(-${pos*100}%${offset}))`;
}

function renderCounter(){
  counter.innerHTML="";
  services.forEach((_,i)=>{
    const dot=document.createElement("span");
    dot.className="counter-dot"+(i===realCurrent?" active":"");
    counter.appendChild(dot);
  });
}

function goTo(direction){
  if(isAnimating)return;
  isAnimating=true;
  pos+=direction;
  setTrack(true);
}

deckTrack.addEventListener("transitionend",()=>{
  isAnimating=false;
  if(pos===0){
    pos=total;
    setTrack(false);
  }else if(pos===total+1){
    pos=1;
    setTrack(false);
  }
  realCurrent=(pos-1+total)%total;
  renderCounter();
});

function nextService(direction=1){
  goTo(direction);
  resetAutoplay();
}

document.getElementById("nextBtn").addEventListener("click",()=>nextService(1));
document.getElementById("prevBtn").addEventListener("click",()=>nextService(-1));

/* Keyboard support */
document.addEventListener("keydown",e=>{
  if(window.innerWidth<=900){
    if(e.key==="ArrowRight")nextService(1);
    if(e.key==="ArrowLeft")nextService(-1);
  }
});

/* Finger / pointer drag */
deck.addEventListener("pointerdown",e=>{
  if(e.pointerType==="mouse" && e.button!==0)return;

  /* If an autoplay slide is mid-transition, freeze it in place
     immediately so the slide stops the instant it's touched. */
  if(isAnimating){
    isAnimating=false;
    setTrack(false);
  }

  isDragging=true;
  dragStartX=e.clientX;
  dragDelta=0;
  deckWidth=deck.getBoundingClientRect().width;
  deck.setPointerCapture(e.pointerId);
  clearInterval(autoplayTimer);
});

deck.addEventListener("pointermove",e=>{
  if(!isDragging)return;
  dragDelta=e.clientX-dragStartX;
  if(Math.abs(dragDelta)>8)e.preventDefault();
  setTrack(false,dragDelta);
});

function endDrag(){
  if(!isDragging)return;
  isDragging=false;

  const threshold=Math.min(90,deckWidth*.18);
  const hadOffset=dragDelta!==0;

  if(Math.abs(dragDelta)>threshold){
    pos+= dragDelta<0?1:-1;
  }

  dragDelta=0;

  if(hadOffset){
    /* Transform is actually changing, so the transition will run
       and transitionend will clear isAnimating for us. */
    isAnimating=true;
    setTrack(true);
  }else{
    /* A plain tap with no movement — nothing to animate, and since
       the transform won't change, transitionend would never fire,
       so don't set isAnimating or it would stay stuck forever. */
    setTrack(false);
  }

  resetAutoplay();
}

deck.addEventListener("pointerup",endDrag);
deck.addEventListener("pointercancel",endDrag);

/* Autoplay — advances on its own, restarts the wait after any
   manual interaction (arrow tap or swipe). */
function startAutoplay(){
  autoplayTimer=setInterval(()=>{
    if(!isDragging)goTo(1);
  },2000);
}

function resetAutoplay(){
  clearInterval(autoplayTimer);
  startAutoplay();
}

buildTrack();
setTrack(false);
renderCounter();
startAutoplay();
}

// ===== Section ===== 

// ===== Contact Section =====

(function () {

    const contactRoot = document.querySelector(".contact");
    if (!contactRoot) return;


    // =========================
    // CONTACT REVEAL ANIMATION
    // =========================

    const items = contactRoot.querySelectorAll(".contact-reveal");

    const obs = new IntersectionObserver(entries => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("show");

                obs.unobserve(entry.target);
            }

        });

    }, {
        threshold: 0.12
    });

    items.forEach(item => obs.observe(item));


    // =========================
    // ENQUIRY FORM
    // =========================

    const form = document.getElementById("enquiryForm");

    if (!form) return;


    form.addEventListener("submit", function (event) {

        // Prevent the page from reloading
        // because JavaScript will handle the submission.
        event.preventDefault();


        // Get all form data
        const data = new FormData(form);

        const name =
            data.get("name") || "";

        const email =
            data.get("email") || "";

        const phone =
            data.get("phone") || "Not provided";

        const company =
            data.get("company") || "Not provided";

        const service =
            data.get("service") || "Not specified";

        const requirements =
            data.get("requirements") || "";


        // =========================
        // CREATE WHATSAPP MESSAGE
        // =========================

        const message =
            "Hi Siligrow, I have a project enquiry.\n\n" +

            "Name: " + name + "\n" +

            "Email: " + email + "\n" +

            "Phone: " + phone + "\n" +

            "Company: " + company + "\n" +

            "Service: " + service + "\n" +

            "Requirements: " + requirements;


        // =========================
        // SILIGROW WHATSAPP NUMBER
        // =========================

        const whatsappNumber = "917076068209";

        const whatsappURL =
            "https://wa.me/" +
            whatsappNumber +
            "?text=" +
            encodeURIComponent(message);


        // =========================
        // SEND EMAIL
        // =========================

        const emailForm = document.createElement("form");

        emailForm.method = "POST";

        emailForm.action =
            "https://formsubmit.co/siligrowteam@gmail.com";

        emailForm.target = "emailSubmitFrame";

        emailForm.style.display = "none";


        // Email subject
        const subject = document.createElement("input");

        subject.type = "hidden";
        subject.name = "_subject";
        subject.value = "New Project Enquiry — Siligrow";

        emailForm.appendChild(subject);


        // Email template
        const template = document.createElement("input");

        template.type = "hidden";
        template.name = "_template";
        template.value = "table";

        emailForm.appendChild(template);


        // Disable captcha
        const captcha = document.createElement("input");

        captcha.type = "hidden";
        captcha.name = "_captcha";
        captcha.value = "false";

        emailForm.appendChild(captcha);


        // Name
        const nameField = document.createElement("input");

        nameField.type = "hidden";
        nameField.name = "Name";
        nameField.value = name;

        emailForm.appendChild(nameField);


        // Email
        const emailField = document.createElement("input");

        emailField.type = "hidden";
        emailField.name = "Email";
        emailField.value = email;

        emailForm.appendChild(emailField);


        // Phone
        const phoneField = document.createElement("input");

        phoneField.type = "hidden";
        phoneField.name = "Phone";
        phoneField.value = phone;

        emailForm.appendChild(phoneField);


        // Company
        const companyField = document.createElement("input");

        companyField.type = "hidden";
        companyField.name = "Company";
        companyField.value = company;

        emailForm.appendChild(companyField);


        // Service
        const serviceField = document.createElement("input");

        serviceField.type = "hidden";
        serviceField.name = "Service";
        serviceField.value = service;

        emailForm.appendChild(serviceField);


        // Requirements
        const requirementsField = document.createElement("textarea");

        requirementsField.name = "Requirements";
        requirementsField.value = requirements;

        emailForm.appendChild(requirementsField);


        // Add temporary email form to page
        document.body.appendChild(emailForm);


        // Submit email
        emailForm.submit();


        // Remove temporary form
        setTimeout(() => {

            emailForm.remove();

        }, 1000);


        // =========================
        // OPEN WHATSAPP
        // =========================

        window.open(
            whatsappURL,
            "_blank"
        );


        // =========================
        // BUTTON FEEDBACK
        // =========================

        const submitButton =
            form.querySelector(".contact-submit");

        if (submitButton) {

            const originalText =
                submitButton.innerHTML;

            submitButton.innerHTML =
                "Enquiry Sent ✓";

            submitButton.disabled = true;


            setTimeout(() => {

                submitButton.innerHTML =
                    originalText;

                submitButton.disabled = false;

            }, 4000);

        }


        // =========================
        // RESET FORM
        // =========================

        setTimeout(() => {

            form.reset();

        }, 500);

    });

})();