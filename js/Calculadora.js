new Vue({
  el: "#app-calc",
  data: {
    SalarioBruto: "",
    DiasTrabalhados: "",
    HorasTrabalhadas: "",
    ValorDaHoraTrabalhada: "",
    isValidInput: true,
    moedaSelecionada: "BRL", // Adicione essa linha para declarar e definir o valor inicial da variável moedaSelecionada
  },
  methods: {
    handleSubmit(event) {
      event.preventDefault();
      if (this.SalarioBruto && this.DiasTrabalhados && this.HorasTrabalhadas) {
        const valorHora =
          this.SalarioBruto / (this.DiasTrabalhados * this.HorasTrabalhadas);
        this.ValorDaHoraTrabalhada = parseFloat(valorHora.toFixed(2));
      } else {
        this.isValidInput = false;
      }
    },
    limparValores(event) {
      event.preventDefault();
      this.SalarioBruto = "";
      this.DiasTrabalhados = "";
      this.HorasTrabalhadas = "";
      this.ValorDaHoraTrabalhada = "";
    },
    formatarMoeda(valor, moeda) {
      return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: moeda,
      });
    },
    formatarMoedaBRL(valor) {
      return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    },
  },
});
