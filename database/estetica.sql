CREATE DATABASE IF NOT EXISTS estetica
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE estetica;

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    localizacao VARCHAR(255),
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo_usuario ENUM('cliente', 'admin') NOT NULL DEFAULT 'cliente',
    status ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo',
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS servicos (
    id_servico INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    duracao_minutos INT NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agendamentos (
    id_agendamento INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_servico INT NOT NULL,
    data_agendamento DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status ENUM('agendado', 'confirmado', 'concluido', 'cancelado') NOT NULL DEFAULT 'agendado',
    observacao TEXT,
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_agendamento_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_agendamento_servico
        FOREIGN KEY (id_servico)
        REFERENCES servicos(id_servico),
    INDEX idx_agendamentos_data_hora (data_agendamento, hora_inicio),
    INDEX idx_agendamentos_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS solicitacoes_agendamento (
    id_solicitacao INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    whatsapp VARCHAR(20) NOT NULL,
    procedimento VARCHAR(100) NOT NULL,
    data_agendamento DATE NOT NULL,
    horario TIME NOT NULL,
    status ENUM('pendente', 'confirmado', 'cancelado') NOT NULL DEFAULT 'pendente',
    data_criacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_solicitacoes_data_horario (data_agendamento, horario),
    INDEX idx_solicitacoes_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO servicos (nome, descricao, duracao_minutos, valor, status)
SELECT 'Botox', 'Aplicacao de toxina botulinica para suavizacao de linhas de expressao.', 60, 0.00, 'ativo'
WHERE NOT EXISTS (SELECT 1 FROM servicos WHERE nome = 'Botox');

INSERT INTO servicos (nome, descricao, duracao_minutos, valor, status)
SELECT 'Preenchedores', 'Procedimento estetico com preenchedores para harmonizacao e volume.', 60, 0.00, 'ativo'
WHERE NOT EXISTS (SELECT 1 FROM servicos WHERE nome = 'Preenchedores');

INSERT INTO servicos (nome, descricao, duracao_minutos, valor, status)
SELECT 'Bioestimuladores', 'Tratamento para estimular colageno e melhorar firmeza da pele.', 60, 0.00, 'ativo'
WHERE NOT EXISTS (SELECT 1 FROM servicos WHERE nome = 'Bioestimuladores');

INSERT INTO servicos (nome, descricao, duracao_minutos, valor, status)
SELECT 'Peeling', 'Renovacao da pele com protocolo personalizado.', 60, 0.00, 'ativo'
WHERE NOT EXISTS (SELECT 1 FROM servicos WHERE nome = 'Peeling');

INSERT INTO servicos (nome, descricao, duracao_minutos, valor, status)
SELECT 'Microagulhamento', 'Estimulo de renovacao cutanea por microagulhamento.', 60, 0.00, 'ativo'
WHERE NOT EXISTS (SELECT 1 FROM servicos WHERE nome = 'Microagulhamento');

INSERT INTO servicos (nome, descricao, duracao_minutos, valor, status)
SELECT 'Limpeza de pele', 'Higienizacao profunda e cuidado facial personalizado.', 60, 0.00, 'ativo'
WHERE NOT EXISTS (SELECT 1 FROM servicos WHERE nome = 'Limpeza de pele');

INSERT INTO servicos (nome, descricao, duracao_minutos, valor, status)
SELECT 'Tratamento capilar', 'Protocolo voltado ao cuidado do couro cabeludo e fios.', 60, 0.00, 'ativo'
WHERE NOT EXISTS (SELECT 1 FROM servicos WHERE nome = 'Tratamento capilar');

INSERT INTO servicos (nome, descricao, duracao_minutos, valor, status)
SELECT 'Enzimas', 'Aplicacao de enzimas conforme avaliacao estetica.', 60, 0.00, 'ativo'
WHERE NOT EXISTS (SELECT 1 FROM servicos WHERE nome = 'Enzimas');

INSERT INTO servicos (nome, descricao, duracao_minutos, valor, status)
SELECT 'Drenagem', 'Drenagem linfatica para bem-estar e reducao de retencao.', 60, 0.00, 'ativo'
WHERE NOT EXISTS (SELECT 1 FROM servicos WHERE nome = 'Drenagem');

INSERT INTO servicos (nome, descricao, duracao_minutos, valor, status)
SELECT 'Massagem', 'Massagem relaxante ou modeladora conforme necessidade.', 60, 0.00, 'ativo'
WHERE NOT EXISTS (SELECT 1 FROM servicos WHERE nome = 'Massagem');
