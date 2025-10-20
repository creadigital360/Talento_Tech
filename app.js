

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('cd360-overlay');
  const toast   = document.getElementById('cd360-toast');
  const linkContacto = document.getElementById('link-contacto');
  const btnClose = document.querySelector('.cd360-close');
  const btnCancelar = document.getElementById('cd360-cancelar');
  const form = document.getElementById('cd360-contact-form');
  const btnEnviar = document.getElementById('cd360-enviar');

  function openModal(){
    overlay.style.display='flex';
    overlay.setAttribute('aria-hidden','false');
    setTimeout(()=> document.getElementById('cd360-nombre')?.focus(), 80);
  }
  function closeModal(){
    overlay.style.display='none';
    overlay.setAttribute('aria-hidden','true');
  }
  function showToast(msg='¡Mensaje enviado! Te contactaremos pronto.', ok=true){
    toast.textContent = msg;
    toast.classList.toggle('err', !ok);
    toast.classList.add('cd360-toast--show');
    setTimeout(()=> toast.classList.remove('cd360-toast--show'), 3800);
  }
  function setLoading(is){
    if(is){
      btnEnviar.classList.add('is-loading');
      btnEnviar.innerHTML = '<span class="spinner"></span>Enviando…';
      btnEnviar.disabled = true;
    }else{
      btnEnviar.classList.remove('is-loading');
      btnEnviar.textContent = 'Enviar mensaje';
      btnEnviar.disabled = false;
    }
  }

  linkContacto?.addEventListener('click', e => { e.preventDefault(); openModal(); });
  btnClose?.addEventListener('click', closeModal);
  btnCancelar?.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if(e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if(e.key==='Escape') closeModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!form.checkValidity()){ form.reportValidity(); return; }

    const payload = {
      nombre:   document.getElementById('cd360-nombre').value.trim(),
      email:    document.getElementById('cd360-email').value.trim(),
      telefono: document.getElementById('cd360-tel').value.trim(),
      servicio: document.getElementById('cd360-servicio').value,
      mensaje:  document.getElementById('cd360-mensaje').value.trim(),
      empresa:  document.getElementById('cd360-empresa').value.trim() // honeypot
    };

    // Timeout para evitar que quede colgado si el servidor no responde
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000);

    setLoading(true);
    try{
      const res = await fetch('https://formspree.io/f/tu-codigo-de-formulario', { 
/* ... */
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload),
        // Si index.html y contacto.php están en el MISMO dominio, esto está OK:
        mode: 'same-origin',
        credentials: 'same-origin',
        signal: controller.signal
      });

      clearTimeout(t);

      // Intentar leer JSON; si no es JSON, leer texto para mostrar el error del servidor
      let data;
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error('Respuesta no JSON del servidor:', text);
        throw new Error('El servidor devolvió un formato inesperado.');
      }

      if(!res.ok || !data.ok){
        throw new Error(data?.error || 'No se pudo enviar. Intenta más tarde.');
      }

      setLoading(false);
      showToast('¡Gracias! Tu mensaje fue enviado con éxito.', true);
      form.reset();
      closeModal();
    }catch(err){
      clearTimeout(t);
      console.error('Error en fetch:', err);
      setLoading(false);

      // Errores típicos: abort (timeout), TypeError (CORS, sin servidor), etc.
      if (err.name === 'AbortError') {
        showToast('El servidor tardó demasiado en responder.', false);
      } else if (String(err).includes('Failed to fetch') || err instanceof TypeError) {
        showToast('No se pudo conectar con el servidor. ¿Subiste contacto.php y estás en http/https?', false);
      } else {
        showToast(err.message || 'Error al enviar. Inténtalo más tarde.', false);

        
      }
    }
  });
});

