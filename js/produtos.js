 function calcularLitragem() {
      const l = parseFloat(document.getElementById('largura').value);
      const c = parseFloat(document.getElementById('comprimento').value);
      const p = parseFloat(document.getElementById('profundidade').value);

      if (isNaN(l) || isNaN(c) || isNaN(p) || l <= 0 || c <= 0 || p <= 0) {
        alert('Por favor, preencha todos os campos com valores válidos.');
        return;
      }

      const litros = Math.round(l * c * p * 1000);
      const formatted = litros.toLocaleString('pt-BR');

      document.getElementById('result-value').textContent = formatted.toLocaleString('pt-BR');
      document.getElementById('treat-link').href = `tratar.html?litros=${litros}`;
      document.getElementById('calc-result').classList.add('show');
      document.getElementById('calc-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function limparCalculo() {
      document.getElementById('largura').value = '';
      document.getElementById('comprimento').value = '';
      document.getElementById('profundidade').value = '';
      document.getElementById('calc-result').classList.remove('show');
    }

    // Permitir Enter
    ['largura','comprimento','profundidade'].forEach(id => {
      document.getElementById(id).addEventListener('keydown', (e) => {
        if (e.key === 'Enter') calcularLitragem();
      });
    });