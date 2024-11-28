// Seleziona il pulsante del menu a tendina e il menu stesso
const menuBtn = document.querySelector('.menu-btn');
const menuItems = document.querySelector('.menu-items');

// Aggiungi evento al pulsante per aprire/chiudere il menu
menuBtn.addEventListener('click', () => {
  menuItems.classList.toggle('active');
});

// Aggiungi evento per le voci del menu per lo scorrimento smooth
const menuLinks = document.querySelectorAll('.menu-items a');
menuLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault(); // Previene il comportamento di default del link
    const targetSection = document.querySelector(link.getAttribute('href'));
    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: 'smooth',  // Scorrimento fluido
        block: 'start'       // Allinea la sezione in cima alla pagina
      });
    }
  });
});

// Aggiungi scorrimento fluido tramite rotellina del mouse
document.documentElement.style.scrollBehavior = "smooth";

// Funzionalità per il menu "Home" che riporta all'inizio della pagina
const homeLink = document.querySelector('a[href="#home"]');
if (homeLink) {
  homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// Funzionalità per il menu "About Me" che riporta alla sezione "About"
const aboutLink = document.querySelector('a[href="#about"]');
if (aboutLink) {
  aboutLink.addEventListener('click', (e) => {
    e.preventDefault();
    const targetSection = document.getElementById('about');
    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: 'smooth'
      });
    }
  });
}

// Funzionalità per il menu "Contact" che riporta alla sezione "Contact"
const contactLink = document.querySelector('a[href="#contact"]');
if (contactLink) {
  contactLink.addEventListener('click', (e) => {
    e.preventDefault();
    const targetSection = document.getElementById('contact');
    if (targetSection) {
      targetSection.scrollIntoView({
        behavior: 'smooth'
      });
    }
  });
}

// Gestione della sezione "Contattami"
// Aggiungi evento al form di contatto per inviare il messaggio
document.getElementById("contact-form").addEventListener("submit", function (e) {
  e.preventDefault();

  // Ottieni i valori dai campi
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const contactMethod = document.getElementById("contact-method").value;
  const message = document.getElementById("message").value;

  // Verifica che tutti i campi siano compilati
  if (!name || !email || !contactMethod || !message) {
    alert("Please fill out all fields.");
    return;
  }

  // Crea il corpo del messaggio
  const messageBody = `Name: ${name}\nEmail: ${email}\nMessage: ${message}`;

  // Azione in base al metodo di contatto selezionato
  if (contactMethod === "email") {
    // Per inviare via email
    window.location.href = `mailto:gabrielelazzara67@gmail.com?subject=Message from ${name}&body=${encodeURIComponent(messageBody)}`;
  } else if (contactMethod === "telegram") {
    // Per inviare via Telegram
    window.location.href = `https://t.me/GabrieleLazzara?text=${encodeURIComponent(messageBody)}`;
  } else if (contactMethod === "discord") {
    // Per inviare via Discord
    window.location.href = `https://discord.com/users/706894566548045914`;
  }
});
