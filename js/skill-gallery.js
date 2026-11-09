/* Full-size view for the Video 3D Studio gallery. Without JS the tiles are plain links to the images. */
(() => {
    const shots = [...document.querySelectorAll('[data-skill-shot]')];
    if (!shots.length || typeof HTMLDialogElement === 'undefined') return;

    const dialog = document.createElement('dialog');
    dialog.className = 'skill-lightbox';
    dialog.innerHTML = '<img alt=""><p></p><button type="button" data-close><i class="fas fa-times"></i></button><button type="button" data-prev><i class="fas fa-chevron-left"></i></button><button type="button" data-next><i class="fas fa-chevron-right"></i></button>';
    document.body.appendChild(dialog);

    const image = dialog.querySelector('img');
    const caption = dialog.querySelector('p');
    const labels = {
        it: { close: 'Chiudi', prev: 'Immagine precedente', next: 'Immagine successiva' },
        en: { close: 'Close', prev: 'Previous image', next: 'Next image' },
    };
    let current = 0;

    const show = (index) => {
        current = (index + shots.length) % shots.length;
        const shot = shots[current];
        image.src = shot.href;
        caption.textContent = shot.querySelector('.skill-shot__caption').textContent;
    };

    const open = (index) => {
        const text = labels[document.documentElement.lang === 'en' ? 'en' : 'it'];
        dialog.querySelector('[data-close]').setAttribute('aria-label', text.close);
        dialog.querySelector('[data-prev]').setAttribute('aria-label', text.prev);
        dialog.querySelector('[data-next]').setAttribute('aria-label', text.next);
        show(index);
        dialog.showModal();
    };

    shots.forEach((shot, index) => {
        shot.addEventListener('click', (event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey) return;
            event.preventDefault();
            open(index);
        });
    });

    dialog.addEventListener('click', (event) => {
        if (event.target.closest('[data-prev]')) show(current - 1);
        else if (event.target.closest('[data-next]')) show(current + 1);
        else if (event.target === dialog || event.target.closest('[data-close]')) dialog.close();
    });

    dialog.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') show(current - 1);
        if (event.key === 'ArrowRight') show(current + 1);
    });

    dialog.addEventListener('close', () => image.removeAttribute('src'));
})();
