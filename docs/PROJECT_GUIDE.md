# DeepSWE View · manutenção

[← README](../README.md)

## Fluxo de mudança

1. Identifique o componente na tabela de arquitetura do README.
2. Confirme o contrato nos arquivos de entrada e manifests; documentação não substitui o código.
3. Faça a alteração em um branch, preservando dados locais e arquivos de origem.
4. Execute as verificações relacionadas ao fluxo e revise `git diff --check`.
5. Descreva evidências e limites; publicar documentação não equivale a publicar uma aplicação.

## Contrato de dados

O frontend importa os JSONs do repositório no build. O nome leaderboard-live.json não significa atualização contínua durante a visita. Atualizações de dados exigem revisar o artefato e suas transformações, incluindo configurações padrão e preços presentes no código.

## Execução e distribuição

Use Node compatível com Vite 7 (20.19+ ou 22.12+). O script dev escuta em 0.0.0.0: a interface pode ficar acessível na sua rede. Abra a URL indicada pelo Vite.

O início rápido descreve desenvolvimento local. Antes de expor o serviço, revise a configuração de hospedagem específica do repositório, permissões, persistência e procedimento de atualização. Segredos e dados de usuários não pertencem aos exemplos nem ao Git.

## Diagnóstico inicial

| Sintoma | Primeiro ponto a conferir |
| --- | --- |
| Gráfico difere entre versões | Confira artifacts/v1 e artifacts/v1.1, a versão selecionada e defaultEffortsByVersion. |
| Preço aparentemente desatualizado | Confira as transformações pricingChanges em src/leaderboard-data.js, além do JSON de origem. |
| Curva ou tooltip fora de escala | Use os checks test:chart-scale, test:chart-path e test:chart-hover-label antes de alterar dados. |

## Limites de interpretação

Este repositório apresenta resultados; não é o executor do benchmark. Não interprete modelos, preços ou resultados versionados como valores atuais verificados. Comparações dependem do conjunto de tarefas, versão e esforço selecionados; preserve fonte e metodologia de cada artefato.

## Base desta documentação

A apresentação foi confrontada com os seguintes arquivos e diretórios do checkout. Essa revisão foi estática; não executou o produto, coletores, instalações ou deploys.

- [src/main.js](../src/main.js) — Interface e interações.
- [src/leaderboard-data.js](../src/leaderboard-data.js) — Seleção e transformação dos artefatos.
- [artifacts/v1/](../artifacts/v1/) — Dados da primeira versão.
- [artifacts/v1.1/](../artifacts/v1.1/) — Dados da versão seguinte.
- [scripts/](../scripts/) — Verificações de gráficos, dados e menus.
