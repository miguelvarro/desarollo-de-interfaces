<style>
  body{
    margin:0;
    height:100vh;
    display:grid;
    place-items:center;
    background:#7a7a7a; 
    font-family: Arial, sans-serif;
  }

  /* --- Contenedor general --- */
  #login{
    width: 420px;
    text-align:center;
    position:relative;
    padding-top: 80px; 
    margin-left: 180px; 
}
  }

  /* --- Logo arriba (placeholder) --- */
  #logo{
    position:absolute;
    top: 0;
    left:50%;
    transform: translateX(-50%);
    width: 260px;
    height: 80px;
    display:grid;
    place-items:center;
    font-weight:bold;
    letter-spacing:1px;
    color:#ffffff;
    text-shadow: 0 2px 0 rgba(0,0,0,.35);
    user-select:none;
  }

  /* --- Pergamino --- */
  #scroll{
    position:relative;
    width: 100%;
    border-radius: 10px;
  }

  /* Rodillos superior/inferior */
  .rod{
    height: 28px;
    border-radius: 8px;
    background: linear-gradient(#6a1f16, #3a0b08);
    box-shadow: 0 8px 18px rgba(0,0,0,.35);
    position:relative;
  }
  .rod::before, .rod::after{
    content:"";
    position:absolute;
    top:50%;
    transform: translateY(-50%);
    width: 18px; height: 18px;
    border-radius: 6px;
    background: linear-gradient(#7a2a1f, #2a0706);
    box-shadow: inset 0 0 0 2px rgba(255,255,255,.08);
  }
  .rod::before{ left:-10px; }
  .rod::after{ right:-10px; }

  /* Cuerpo del pergamino */
  .paper{
    background: linear-gradient(#e7d2aa, #dfc392);
    border-left: 12px solid #1c2a1f;   
    border-right: 12px solid #1c2a1f;
    box-shadow: 0 14px 28px rgba(0,0,0,.45);
    padding: 18px 22px 22px;
    position:relative;
  }

  /* Textura simple del papel */
  .paper::before{
    content:"";
    position:absolute; inset:0;
    background:
      radial-gradient(circle at 20% 30%, rgba(0,0,0,.06), transparent 40%),
      radial-gradient(circle at 70% 65%, rgba(0,0,0,.05), transparent 45%),
      repeating-linear-gradient(0deg, rgba(0,0,0,.02), rgba(0,0,0,.02) 2px, transparent 10px, transparent 18px);
    opacity:.55;
    pointer-events:none;
  }

  /* cuerditas laterales y etiquetas */
  .tag{
    position:absolute;
    top: 120px;
    width: 120px;
    height: 30px;
    background:#2c2c2c;
    color:#fff;
    font-size: 11px;
    display:flex;
    align-items:center;
    justify-content:center;
    border-radius: 3px;
    box-shadow: 0 6px 14px rgba(0,0,0,.35);
    opacity:.95;
  }
  .tag.left{ left:-145px; }
  .tag.right{ right:-145px; }

  .tag::before{
    content:"";
    position:absolute;
    top:-55px;
    left:50%;
    transform: translateX(-50%);
    width:2px;
    height:55px;
    background: #b13a2a;
  }
  .tag::after{
    content:"";
    position:absolute;
    top:-66px;
    left:50%;
    transform: translateX(-50%);
    width: 12px;
    height: 12px;
    background:#c9c9c9;
    border-radius: 2px;
    box-shadow: 0 2px 6px rgba(0,0,0,.25);
  }

  /* --- Formulario (contenido) --- */
  form{
    position:relative;
    z-index: 1; 
    margin:0;
  }

  .label{
    margin: 6px 0 6px;
    font-weight: 800;
    letter-spacing: 1px;
    color:#2a2114;
    font-size: 14px;
  }

  /* Input con marco tipo “madera + esquinas” */
  .frame{
    background: linear-gradient(#7d2a20, #4b0f0c);
    border-radius: 8px;
    padding: 6px;
    margin: 0 auto 14px;
    box-shadow: inset 0 0 0 2px rgba(255,255,255,.12);
  }
  .frame input{
    width: 100%;
    padding: 12px 10px;
    border:0;
    outline:0;
    border-radius: 6px;
    background: rgba(255,255,255,.25);
    color:#1d160e;
    font-size: 14px;
  }
  .frame input::placeholder{
    color: rgba(0,0,0,.45);
  }
  .frame:focus-within{
    box-shadow: inset 0 0 0 2px rgba(255,255,255,.20), 0 0 0 4px rgba(67,120,255,.25);
  }

  /* botones */
  .actions{
    display:flex;
    justify-content:space-between;
    gap: 14px;
    margin-top: 14px;
  }
  button{
    flex:1;
    padding: 12px 10px;
    border:0;
    cursor:pointer;
    font-weight: 800;
    letter-spacing: .8px;
    border-radius: 10px;
    background: linear-gradient(#d5f0f7, #6fb5c9);
    box-shadow: 0 10px 18px rgba(0,0,0,.25);
  }
  button:hover{ filter: brightness(1.03); }
  button:active{ transform: translateY(1px); }

  /* pequeño detalle “nube” debajo de botones */
  .clouds{
    margin-top: 10px;
    height: 14px;
    display:flex;
    justify-content:center;
    gap: 6px;
    opacity:.85;
  }
  .clouds span{
    width: 26px; height: 12px;
    border-radius: 999px;
    background: #e9d18a;
    box-shadow: inset 0 0 0 2px rgba(0,0,0,.08);
  }

  /* responsive mínimo */
  @media (max-width: 560px){
    #login{ width: 92vw; }
    .tag.left{ left:-10px; top: -42px; }
    .tag.right{ right:-10px; top: -42px; }
    .tag::before{ display:none; }
    .tag::after{ display:none; }
  }
</style>

<section id="login">
  <div id="logo">SHINOBI STYLE</div>

  <div id="scroll">
    <div class="rod"></div>

    <div class="paper">
      <div class="tag left">Remember Username</div>
      <div class="tag right">Options</div>

      <form id="loginForm">
        <div class="label">USERNAME</div>
        <div class="frame">
          <input type="text" id="usuario" placeholder="Usuario" autocomplete="username" />
        </div>

        <div class="label">PASSWORD</div>
        <div class="frame">
          <input type="password" id="contrasena" placeholder="Contraseña" autocomplete="current-password" />
        </div>

        <div class="actions">
          <button type="button" id="btnLogin">LOG IN</button>
          <button type="button" id="btnSignup">SIGN UP</button>
        </div>

        <div class="clouds" aria-hidden="true">
          <span></span><span></span><span></span>
        </div>
      </form>
    </div>

    <div class="rod"></div>
  </div>
</section>

<script>
  let botonLogin = document.querySelector("#btnLogin");
  let botonSignup = document.querySelector("#btnSignup");

  botonLogin.onclick = function(){
    console.log("LOG IN:", document.querySelector("#usuario").value);
  }

  botonSignup.onclick = function(){
    console.log("SIGN UP");
  }
</script>

