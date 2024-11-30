document.addEventListener('DOMContentLoaded', () => {
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.menu');
  
  menuButton.addEventListener('click', () => {
      menu.classList.toggle('active');
  });

  // Dynamic Background on Scroll
  window.addEventListener('scroll', () => {
      const scrollPosition = window.scrollY;
      const heroSection = document.getElementById('hero');
      let colorValue = Math.min(scrollPosition / 5, 255);
      heroSection.style.background = `linear-gradient(to right, rgb(${colorValue}, 123, 255), rgb(${colorValue}, 201, 255))`;
  });
});
