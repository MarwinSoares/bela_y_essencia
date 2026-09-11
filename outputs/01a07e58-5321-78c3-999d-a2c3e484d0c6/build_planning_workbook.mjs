import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = ".";
const outputPath = `${outputDir}/planejamento_bela_y_essencia.xlsx`;
const fontFamily = "Arial";

const colors = {
  text: "#2F2926",
  muted: "#6F625D",
  line: "#D8CBC4",
  title: "#413631",
  titleSoft: "#5E514B",
  header: "#413631",
  header2: "#765A50",
  rose: "#B97973",
  roseLight: "#F6E7E5",
  cream: "#FFFDFA",
  sand: "#F6EEE8",
  amber: "#F7E7BF",
  green: "#DDEDDD",
  blue: "#E3ECF7",
  red: "#FCE4E4",
};

const d = (yyyy, mm, dd) => new Date(yyyy, mm - 1, dd);

const backlogRows = [
  ["PL-001", "Fundação", "Inventário técnico e rotas", "Mapear páginas existentes, formulários e próximas rotas do sistema.", "Alta", "Não iniciado", "Desenvolvedor", 1, d(2026, 9, 8), d(2026, 9, 8), "Arquivos atuais do projeto", "Mapa de rotas aprovado.", "Projeto hoje tem landing page, página dedicada de agendamento, CSS e scripts.", "Sim"],
  ["PL-002", "Fundação", "Modelo de dados", "Definir tabelas de usuários, serviços, agendamentos, disponibilidade e status.", "Alta", "Não iniciado", "Desenvolvedor", 2, d(2026, 9, 9), d(2026, 9, 10), "PL-001", "Campos essenciais definidos para cadastro, login e agenda.", "Base para escolher backend ou banco de dados.", "Sim"],
  ["AUT-001", "Autenticação", "Página de login", "Permitir entrada do usuário com e-mail e senha.", "Alta", "Não iniciado", "Desenvolvedor", 2, d(2026, 9, 11), d(2026, 9, 14), "PL-002", "Usuário consegue acessar a conta e ver mensagens de erro claras.", "Criar login.html ou rota equivalente.", "Sim"],
  ["AUT-002", "Autenticação", "Página de cadastro", "Criar conta de cliente com nome, WhatsApp, e-mail e senha.", "Alta", "Não iniciado", "Desenvolvedor", 2, d(2026, 9, 15), d(2026, 9, 16), "PL-002", "Cadastro salva dados, valida campos obrigatórios e evita e-mail duplicado.", "Criar cadastro.html ou rota equivalente.", "Sim"],
  ["AUT-003", "Autenticação", "Recuperação de senha", "Permitir que o usuário solicite redefinição de senha.", "Média", "Não iniciado", "Desenvolvedor", 1, d(2026, 9, 17), d(2026, 9, 17), "AUT-001", "Usuário recebe caminho seguro para redefinir a senha.", "Pode ficar fora do MVP se o prazo apertar.", "Não"],
  ["AUT-004", "Autenticação", "Sessão e proteção de páginas", "Manter usuário logado e bloquear áreas privadas para visitantes.", "Alta", "Não iniciado", "Desenvolvedor", 2, d(2026, 9, 18), d(2026, 9, 21), "AUT-001, AUT-002", "Área do usuário exige login e redireciona visitantes.", "Inclui logout.", "Sim"],
  ["USR-001", "Área do usuário", "Painel do usuário", "Mostrar saudação, próximo agendamento e atalhos principais.", "Alta", "Não iniciado", "Desenvolvedor", 2, d(2026, 9, 22), d(2026, 9, 23), "AUT-004", "Usuário vê um painel simples após entrar.", "Criar area-usuario.html ou dashboard do cliente.", "Sim"],
  ["USR-002", "Área do usuário", "Meus agendamentos", "Listar agendamentos futuros e histórico do usuário.", "Alta", "Não iniciado", "Desenvolvedor", 2, d(2026, 9, 24), d(2026, 9, 25), "USR-001, PL-002", "Lista mostra procedimento, data, horário e status.", "Item citado diretamente no pedido.", "Sim"],
  ["USR-003", "Área do usuário", "Detalhe, remarcação e cancelamento", "Permitir ver detalhes e solicitar alteração de horário.", "Alta", "Não iniciado", "Desenvolvedor", 3, d(2026, 9, 28), d(2026, 9, 30), "USR-002", "Usuário consegue cancelar ou pedir remarcação respeitando regras definidas.", "Definir antecedência mínima.", "Sim"],
  ["USR-004", "Área do usuário", "Perfil do usuário", "Editar dados pessoais e preferências de contato.", "Média", "Não iniciado", "Desenvolvedor", 1, d(2026, 10, 1), d(2026, 10, 1), "USR-001", "Dados editados aparecem nos próximos agendamentos.", "Campos: nome, WhatsApp, e-mail.", "Não"],
  ["AGD-001", "Agendamento", "Agendamento com usuário logado", "Preencher dados automaticamente quando o cliente estiver autenticado.", "Alta", "Não iniciado", "Desenvolvedor", 2, d(2026, 10, 2), d(2026, 10, 5), "AUT-004, USR-001", "Cliente logado agenda sem repetir nome e contato.", "Unificar regra entre index.html e agendamento.html.", "Sim"],
  ["AGD-002", "Agendamento", "Validação de disponibilidade", "Impedir conflito de horário quando a equipe confirmar um atendimento.", "Alta", "Não iniciado", "Desenvolvedor", 3, d(2026, 10, 6), d(2026, 10, 8), "PL-002", "Sistema não permite confirmar dois atendimentos no mesmo horário.", "Hoje os horários exibidos são exemplos.", "Sim"],
  ["ADM-001", "Administração", "Login administrativo e permissões", "Separar acesso da equipe do acesso de clientes.", "Alta", "Não iniciado", "Desenvolvedor", 2, d(2026, 10, 9), d(2026, 10, 12), "AUT-004", "Somente equipe autorizada acessa administração.", "Pode usar perfil admin no mesmo sistema de login.", "Sim"],
  ["ADM-002", "Administração", "Painel de agendamentos", "Visualizar, filtrar, confirmar, remarcar e cancelar solicitações.", "Alta", "Não iniciado", "Desenvolvedor", 3, d(2026, 10, 13), d(2026, 10, 15), "ADM-001, AGD-002", "Equipe consegue mudar status e encontrar agendamentos por data, cliente e serviço.", "Essencial para fechar o ciclo de agenda.", "Sim"],
  ["ADM-003", "Administração", "Cadastro de serviços", "Gerenciar procedimentos, duração, preço base e status ativo.", "Média", "Não iniciado", "Desenvolvedor", 2, d(2026, 10, 16), d(2026, 10, 19), "ADM-001, PL-002", "Equipe pode ativar, desativar e editar serviços.", "Facilita manter lista de tratamentos sem mexer no HTML.", "Não"],
  ["ADM-004", "Administração", "Horários e bloqueios", "Gerenciar agenda de funcionamento, folgas e horários indisponíveis.", "Média", "Não iniciado", "Desenvolvedor", 2, d(2026, 10, 20), d(2026, 10, 21), "ADM-002", "Equipe bloqueia datas e horários sem alterar código.", "Importante antes de automatizar disponibilidade.", "Não"],
  ["COM-001", "Comunicação", "Confirmações por WhatsApp ou e-mail", "Enviar aviso ao cliente quando a equipe confirmar ou alterar o agendamento.", "Média", "Não iniciado", "Desenvolvedor", 2, d(2026, 10, 22), d(2026, 10, 23), "ADM-002", "Cliente recebe mensagem com data, horário e procedimento.", "Começar com template simples.", "Não"],
  ["SEC-001", "Segurança", "Consentimento e LGPD", "Adicionar política de privacidade, consentimento e tratamento seguro dos dados.", "Alta", "Não iniciado", "Desenvolvedor", 2, d(2026, 10, 26), d(2026, 10, 27), "AUT-002, AGD-001", "Formulários informam uso de dados e dados sensíveis ficam protegidos.", "Especialmente importante por envolver dados de contato e tratamentos.", "Sim"],
  ["UI-001", "Interface", "Padronização de marca e navegação", "Unificar textos de marca, CTAs, links e caminhos entre páginas.", "Média", "Não iniciado", "Design/Dev", 1, d(2026, 10, 28), d(2026, 10, 28), "Páginas atuais", "Usuário navega entre início, agendamento, login, cadastro e área logada sem becos sem saída.", "O site mistura Bela y Essência e Atelier Lumière.", "Sim"],
  ["QA-001", "Qualidade", "Testes dos fluxos principais", "Testar cadastro, login, agendamento, visualização, cancelamento e administração.", "Alta", "Não iniciado", "Desenvolvedor", 2, d(2026, 10, 29), d(2026, 10, 30), "Todas as telas do MVP", "Fluxos principais passam em desktop e celular.", "Criar checklist manual se não houver testes automatizados.", "Sim"],
  ["DEP-001", "Publicação", "Deploy, backup e monitoramento", "Publicar a versão inicial e definir rotina de backup dos dados.", "Alta", "Não iniciado", "Desenvolvedor", 1, d(2026, 11, 2), d(2026, 11, 2), "QA-001", "Site publicado, dados preservados e caminho de rollback definido.", "Último passo antes de uso real.", "Sim"],
];

const roadmapRows = [
  ["Fundação", "Definir base técnica e dados do sistema.", d(2026, 9, 8), d(2026, 9, 10), "Sem modelo de dados, login e agenda ficam soltos.", "Mapa técnico e estrutura de dados aprovados."],
  ["Autenticação", "Criar login, cadastro, recuperação e sessão.", d(2026, 9, 11), d(2026, 9, 21), "Fluxo precisa tratar erros sem expor dados.", "Cliente entra, sai e recupera acesso."],
  ["Área do usuário", "Entregar painel do cliente e histórico de agendamentos.", d(2026, 9, 22), d(2026, 10, 1), "Regra de cancelamento/remarcação precisa ser definida.", "Cliente consulta e gerencia seus horários."],
  ["Agendamento", "Conectar agenda ao usuário e validar disponibilidade.", d(2026, 10, 2), d(2026, 10, 8), "Disponibilidade real depende do modelo de horários.", "Agendamento evita conflito de horário."],
  ["Administração", "Dar controle da agenda para a equipe.", d(2026, 10, 9), d(2026, 10, 21), "Permissões precisam separar equipe e clientes.", "Equipe confirma, filtra e gerencia horários."],
  ["Comunicação", "Avisar cliente sobre confirmações e alterações.", d(2026, 10, 22), d(2026, 10, 23), "Depende de canal escolhido para envio.", "Cliente recebe informação clara do agendamento."],
  ["Segurança", "Fechar consentimento, privacidade e proteção de dados.", d(2026, 10, 26), d(2026, 10, 27), "Dados pessoais e tratamentos exigem cuidado.", "Formulários e páginas privadas ficam adequados."],
  ["Interface", "Ajustar navegação e padronizar marca.", d(2026, 10, 28), d(2026, 10, 28), "Textos atuais misturam marcas.", "Experiência fica coesa em todas as telas."],
  ["Qualidade", "Validar fluxos em desktop e celular.", d(2026, 10, 29), d(2026, 10, 30), "Erros de fluxo devem ser corrigidos antes do deploy.", "Checklist principal aprovado."],
  ["Publicação", "Publicar e definir backup.", d(2026, 11, 2), d(2026, 11, 2), "Precisa de ambiente e credenciais.", "Versão inicial disponível para uso."],
];

const inventoryRows = [
  ["Landing page", "Existente", "index.html", "Manter como entrada principal e adicionar links para login e cadastro."],
  ["Formulário de agendamento na home", "Existente", "index.html e script/index.js", "Decidir se continua na home ou se redireciona para a página dedicada."],
  ["Página dedicada de agendamento", "Existente", "agendamento.html e script/agendamento.js", "Integrar com usuário logado e disponibilidade real."],
  ["Estilos", "Existente", "css/style.css e css/agendamento.css", "Reaproveitar padrão visual nas novas telas."],
  ["Login", "Ausente", "Nenhum arquivo identificado", "Criar página ou rota protegida por autenticação."],
  ["Cadastro", "Ausente", "Nenhum arquivo identificado", "Criar cadastro com validacao e aceite de privacidade."],
  ["Área do usuário", "Ausente", "Nenhum arquivo identificado", "Criar painel com meus agendamentos e perfil."],
  ["Administração", "Ausente", "Nenhum arquivo identificado", "Criar acesso da equipe para gerenciar solicitações."],
  ["Banco de dados e regras de auth", "Não identificado", "Scripts usam window.dataSdk", "Definir persistência final, usuários, permissões e status da agenda."],
  ["Padrão de marca", "Requer ajuste", "Textos usam Bela y Essência e Atelier Lumière", "Unificar nome, rodapé, confirmações e depoimentos."],
];

const workbook = Workbook.create();
const summary = workbook.worksheets.add("Resumo");
const backlog = workbook.worksheets.add("Backlog");
const roadmap = workbook.worksheets.add("Roadmap");
const inventory = workbook.worksheets.add("Inventário atual");

for (const sheet of [summary, backlog, roadmap, inventory]) {
  sheet.showGridLines = false;
  sheet.getRange("A1:N80").format.font = { name: fontFamily, size: 10, color: colors.text };
  sheet.getRange("A1:N80").format.verticalAlignment = "center";
}

summary.tabColor = colors.title;
backlog.tabColor = colors.header2;
roadmap.tabColor = colors.rose;
inventory.tabColor = "#9A8A80";

function styleTitle(sheet, range, title, subtitle) {
  sheet.getRange(range).values = [[title]];
  sheet.getRange(range).format.font = { name: fontFamily, size: 14, bold: true, color: colors.title };
  const subtitleCell = range.replace(/\d+$/, (n) => String(Number(n) + 1));
  sheet.getRange(subtitleCell).values = [[subtitle]];
  sheet.getRange(subtitleCell).format.font = { name: fontFamily, size: 10, italic: true, color: colors.muted };
}

function styleHeader(range) {
  range.format.fill = colors.header;
  range.format.font = { name: fontFamily, size: 10, bold: true, color: "#FFFFFF" };
  range.format.horizontalAlignment = "center";
  range.format.verticalAlignment = "center";
  range.format.borders = { preset: "outside", style: "thin", color: colors.header };
}

function styleLightHeader(range) {
  range.format.fill = colors.sand;
  range.format.font = { name: fontFamily, size: 10, bold: true, color: colors.title };
  range.format.borders = { preset: "outside", style: "thin", color: colors.line };
}

function setWidths(sheet, widths) {
  widths.forEach((width, index) => {
    sheet.getRangeByIndexes(0, index, 1, 1).format.columnWidth = width;
  });
}

function addStatusConditionalFormatting(range) {
  range.conditionalFormats.add("containsText", {
    text: "Concluído",
    format: { fill: colors.green, font: { color: "#166534", bold: true } },
  });
  range.conditionalFormats.add("containsText", {
    text: "Em andamento",
    format: { fill: colors.blue, font: { color: "#1D4ED8", bold: true } },
  });
  range.conditionalFormats.add("containsText", {
    text: "Aguardando decisão",
    format: { fill: colors.amber, font: { color: "#92400E", bold: true } },
  });
}

function addPriorityConditionalFormatting(range) {
  range.conditionalFormats.add("containsText", {
    text: "Alta",
    format: { fill: colors.red, font: { color: "#9F1239", bold: true } },
  });
  range.conditionalFormats.add("containsText", {
    text: "Média",
    format: { fill: colors.amber, font: { color: "#92400E", bold: true } },
  });
}

// Resumo
styleTitle(summary, "A2", "Planejamento do sistema Bela y Essência", "Baseado nos arquivos atuais do projeto em 08/09/2026.");
summary.getRange("A4:C11").values = [
  ["Indicador", "Leitura", "Valor"],
  ["Itens planejados", "Total de tarefas no backlog", null],
  ["Itens pendentes", "Tudo que ainda não está concluído", null],
  ["Alta prioridade", "Itens que protegem o MVP", null],
  ["Esforço estimado", "Soma de dias de desenvolvimento", null],
  ["Entrega sugerida", "Maior data de entrega do backlog", null],
  ["Escopo MVP", "Percentual de itens marcados como MVP", null],
  ["Próxima frente", "Primeira prioridade alta no backlog", null],
];
styleHeader(summary.getRange("A4:C4"));
summary.getRange("C5:C11").formulas = [
  ["=COUNTA(Backlog!$A$8:$A$28)"],
  ["=COUNTIFS(Backlog!$F$8:$F$28,\"<>Concluído\")"],
  ["=COUNTIFS(Backlog!$E$8:$E$28,\"Alta\")"],
  ["=SUM(Backlog!$H$8:$H$28)"],
  ["=MAX(Backlog!$J$8:$J$28)"],
  ["=IF(C5=0,\"n.a.\",COUNTIFS(Backlog!$N$8:$N$28,\"Sim\")/C5)"],
  ["=INDEX(Backlog!$C$8:$C$28,MATCH(\"Alta\",Backlog!$E$8:$E$28,0))"],
];
summary.getRange("C9").setNumberFormat("dd/mm/yyyy");
summary.getRange("C10").setNumberFormat("0.0%");
summary.getRange("C5:C8").setNumberFormat("#,##0");
summary.getRange("A5:C11").format.borders = { preset: "insideHorizontal", style: "thin", color: colors.line };
summary.getRange("A5:B11").format.fill = colors.cream;
summary.getRange("C5:C11").format.fill = colors.roseLight;
summary.getRange("C5:C11").format.font = { name: fontFamily, size: 10, bold: true, color: colors.title };

summary.getRange("E4:F7").values = [
  ["Prioridade", "Itens"],
  ["Alta", null],
  ["Média", null],
  ["Baixa", null],
];
summary.getRange("F5:F7").formulas = [
  ["=COUNTIFS(Backlog!$E$8:$E$28,E5)"],
  ["=COUNTIFS(Backlog!$E$8:$E$28,E6)"],
  ["=COUNTIFS(Backlog!$E$8:$E$28,E7)"],
];
styleHeader(summary.getRange("E4:F4"));
summary.getRange("E5:F7").format.borders = { preset: "insideHorizontal", style: "thin", color: colors.line };
addPriorityConditionalFormatting(summary.getRange("E5:E7"));

summary.getRange("H4:I8").values = [
  ["Status", "Itens"],
  ["Não iniciado", null],
  ["Em andamento", null],
  ["Aguardando decisão", null],
  ["Concluído", null],
];
summary.getRange("I5:I8").formulas = [
  ["=COUNTIFS(Backlog!$F$8:$F$28,H5)"],
  ["=COUNTIFS(Backlog!$F$8:$F$28,H6)"],
  ["=COUNTIFS(Backlog!$F$8:$F$28,H7)"],
  ["=COUNTIFS(Backlog!$F$8:$F$28,H8)"],
];
styleHeader(summary.getRange("H4:I4"));
summary.getRange("H5:I8").format.borders = { preset: "insideHorizontal", style: "thin", color: colors.line };
addStatusConditionalFormatting(summary.getRange("H5:H8"));

summary.getRange("A14:D20").values = [
  ["Leitura rápida", "", "", ""],
  ["O que já existe", "Landing page, formulários de agendamento, página dedicada de agendamento, CSS e scripts.", "", ""],
  ["Principais faltas", "Login, cadastro, área do usuário, meus agendamentos, administração, disponibilidade real e LGPD.", "", ""],
  ["Primeira decisão", "Escolher como usuários e agendamentos serão salvos antes de criar as telas privadas.", "", ""],
  ["MVP recomendado", "Autenticação, área do usuário, meus agendamentos, agenda com usuário logado, painel admin e testes.", "", ""],
  ["Risco de escopo", "Automação de mensagens e gestão completa de serviços podem ficar para uma segunda versão.", "", ""],
  ["Ajuste de conteúdo", "Unificar a marca entre Bela y Essência e Atelier Lumière.", "", ""],
];
summary.getRange("A14:D14").merge();
styleLightHeader(summary.getRange("A14:D14"));
summary.getRange("A15:A20").format.font = { name: fontFamily, size: 10, bold: true, color: colors.title };
summary.getRange("B15:D20").merge(true);
summary.getRange("A15:D20").format.borders = { preset: "insideHorizontal", style: "thin", color: colors.line };
summary.getRange("B15:D20").format.wrapText = true;

setWidths(summary, [24, 42, 18, 4, 18, 12, 4, 24, 12]);

// Backlog
styleTitle(backlog, "A2", "Backlog de páginas e funcionalidades", "Edite prioridade, status, responsável e datas conforme o andamento.");
const backlogHeaders = [["ID", "Fase", "Página ou funcionalidade", "Objetivo", "Prioridade", "Status", "Responsável", "Dias", "Início sugerido", "Entrega sugerida", "Dependências", "Critério de aceite", "Observações", "MVP"]];
backlog.getRange("A7:N7").values = backlogHeaders;
backlog.getRange("A8:N28").values = backlogRows;
styleHeader(backlog.getRange("A7:N7"));
backlog.getRange("A8:N28").format.borders = { preset: "insideHorizontal", style: "thin", color: colors.line };
backlog.getRange("A8:N28").format.fill = colors.cream;
backlog.getRange("C8:C28").format.wrapText = true;
backlog.getRange("D8:D28").format.wrapText = true;
backlog.getRange("K8:M28").format.wrapText = true;
backlog.getRange("H8:H28").setNumberFormat("#,##0");
backlog.getRange("I8:J28").setNumberFormat("dd/mm/yyyy");
backlog.getRange("A8:A28").format.font = { name: fontFamily, size: 10, bold: true, color: colors.title };
backlog.getRange("E8:E28").dataValidation = { rule: { type: "list", values: ["Alta", "Média", "Baixa"] } };
backlog.getRange("F8:F28").dataValidation = { rule: { type: "list", values: ["Não iniciado", "Em andamento", "Aguardando decisão", "Concluído"] } };
backlog.getRange("G8:G28").dataValidation = { rule: { type: "list", values: ["Desenvolvedor", "Design/Dev", "Cliente", "Equipe"] } };
backlog.getRange("N8:N28").dataValidation = { rule: { type: "list", values: ["Sim", "Não"] } };
addPriorityConditionalFormatting(backlog.getRange("E8:E28"));
addStatusConditionalFormatting(backlog.getRange("F8:F28"));
const backlogTable = backlog.tables.add("A7:N28", true, "BacklogTable");
backlogTable.style = "TableStyleLight1";
styleHeader(backlog.getRange("A7:N7"));
backlog.getRange("A8:N28").format.fill = colors.cream;
addPriorityConditionalFormatting(backlog.getRange("E8:E28"));
addStatusConditionalFormatting(backlog.getRange("F8:F28"));
backlog.freezePanes.freezeRows(7);
setWidths(backlog, [12, 18, 34, 50, 13, 18, 18, 9, 15, 16, 28, 50, 50, 10]);

// Roadmap
styleTitle(roadmap, "A2", "Roadmap sugerido", "As contagens e dias puxam o backlog por fase.");
roadmap.getRange("A5:J5").values = [["Fase", "Objetivo", "Início", "Entrega", "Itens", "Dias", "Progresso", "Status da fase", "Risco principal", "Entrega da fase"]];
roadmap.getRange("A6:D15").values = roadmapRows.map((row) => row.slice(0, 4));
roadmap.getRange("I6:J15").values = roadmapRows.map((row) => [row[4], row[5]]);
roadmap.getRange("E6:H15").formulas = roadmapRows.map((row, i) => {
  const excelRow = 6 + i;
  return [
    `=COUNTIFS(Backlog!$B$8:$B$28,A${excelRow})`,
    `=SUMIFS(Backlog!$H$8:$H$28,Backlog!$B$8:$B$28,A${excelRow})`,
    `=IF(E${excelRow}=0,"n.a.",COUNTIFS(Backlog!$B$8:$B$28,A${excelRow},Backlog!$F$8:$F$28,"Concluído")/E${excelRow})`,
    `=IF(G${excelRow}=1,"Concluído",IF(COUNTIFS(Backlog!$B$8:$B$28,A${excelRow},Backlog!$F$8:$F$28,"Em andamento")>0,"Em andamento","Não iniciado"))`,
  ];
});
styleHeader(roadmap.getRange("A5:J5"));
roadmap.getRange("A6:J15").format.borders = { preset: "insideHorizontal", style: "thin", color: colors.line };
roadmap.getRange("A6:J15").format.fill = colors.cream;
roadmap.getRange("C6:D15").setNumberFormat("dd/mm/yyyy");
roadmap.getRange("E6:F15").setNumberFormat("#,##0");
roadmap.getRange("G6:G15").setNumberFormat("0.0%");
roadmap.getRange("B6:B15").format.wrapText = true;
roadmap.getRange("I6:J15").format.wrapText = true;
addStatusConditionalFormatting(roadmap.getRange("H6:H15"));
const roadmapTable = roadmap.tables.add("A5:J15", true, "RoadmapTable");
roadmapTable.style = "TableStyleLight1";
styleHeader(roadmap.getRange("A5:J5"));
roadmap.getRange("A6:J15").format.fill = colors.cream;
addStatusConditionalFormatting(roadmap.getRange("H6:H15"));
roadmap.freezePanes.freezeRows(5);
setWidths(roadmap, [20, 42, 14, 14, 10, 10, 12, 18, 42, 44]);

// Inventário atual
styleTitle(inventory, "A2", "Inventário atual do projeto", "Leitura rápida dos arquivos encontrados e das lacunas principais.");
inventory.getRange("A5:D5").values = [["Item", "Situação", "Evidência", "Próxima ação"]];
inventory.getRange("A6:D15").values = inventoryRows;
styleHeader(inventory.getRange("A5:D5"));
inventory.getRange("A6:D15").format.borders = { preset: "insideHorizontal", style: "thin", color: colors.line };
inventory.getRange("A6:D15").format.fill = colors.cream;
inventory.getRange("D6:D15").format.wrapText = true;
inventory.getRange("B6:B15").conditionalFormats.add("containsText", {
  text: "Existente",
  format: { fill: colors.green, font: { color: "#166534", bold: true } },
});
inventory.getRange("B6:B15").conditionalFormats.add("containsText", {
  text: "Ausente",
  format: { fill: colors.red, font: { color: "#9F1239", bold: true } },
});
inventory.getRange("B6:B15").conditionalFormats.add("containsText", {
  text: "Requer ajuste",
  format: { fill: colors.amber, font: { color: "#92400E", bold: true } },
});
inventory.getRange("B6:B15").conditionalFormats.add("containsText", {
  text: "Não identificado",
  format: { fill: colors.blue, font: { color: "#1D4ED8", bold: true } },
});
const inventoryTable = inventory.tables.add("A5:D15", true, "InventoryTable");
inventoryTable.style = "TableStyleLight1";
styleHeader(inventory.getRange("A5:D5"));
inventory.getRange("A6:D15").format.fill = colors.cream;
inventory.getRange("B6:B15").conditionalFormats.add("containsText", {
  text: "Existente",
  format: { fill: colors.green, font: { color: "#166534", bold: true } },
});
inventory.getRange("B6:B15").conditionalFormats.add("containsText", {
  text: "Ausente",
  format: { fill: colors.red, font: { color: "#9F1239", bold: true } },
});
inventory.getRange("B6:B15").conditionalFormats.add("containsText", {
  text: "Requer ajuste",
  format: { fill: colors.amber, font: { color: "#92400E", bold: true } },
});
inventory.getRange("B6:B15").conditionalFormats.add("containsText", {
  text: "Não identificado",
  format: { fill: colors.blue, font: { color: "#1D4ED8", bold: true } },
});
inventory.freezePanes.freezeRows(5);
setWidths(inventory, [32, 18, 42, 62]);

// Common polish
for (const sheet of [summary, backlog, roadmap, inventory]) {
  const used = sheet.getUsedRange();
  used.format.autofitRows();
  used.format.verticalAlignment = "center";
}
summary.getRange("B15:D20").format.rowHeight = 42;
backlog.getRange("A8:N28").format.rowHeight = 48;
roadmap.getRange("A6:J15").format.rowHeight = 42;
inventory.getRange("A6:D15").format.rowHeight = 40;

workbook.recalculate();

const summaryCheck = await workbook.inspect({
  kind: "table",
  range: "Resumo!A4:I11",
  include: "values,formulas",
  tableMaxRows: 12,
  tableMaxCols: 10,
});
console.log(summaryCheck.ndjson);

const backlogCheck = await workbook.inspect({
  kind: "table",
  range: "Backlog!A7:N28",
  include: "values,formulas",
  tableMaxRows: 24,
  tableMaxCols: 14,
});
console.log(backlogCheck.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

await fs.mkdir(outputDir, { recursive: true });
const previewNames = {
  "Resumo": "preview_resumo.png",
  "Backlog": "preview_backlog.png",
  "Roadmap": "preview_roadmap.png",
  "Inventário atual": "preview_inventario_atual.png",
};

for (const sheetName of ["Resumo", "Backlog", "Roadmap", "Inventário atual"]) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 1, format: "png" });
  await fs.writeFile(`${outputDir}/${previewNames[sheetName]}`, new Uint8Array(await preview.arrayBuffer()));
}

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(outputPath);
console.log(`Saved ${outputPath}`);
