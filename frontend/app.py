# frontend/app.py
import streamlit as st
import pandas as pd
import requests
import json
import os
from datetime import datetime

st.set_page_config(
    page_title="POC Automação Cypress",
    page_icon="🚀",
    layout="wide"
)

st.title("🚀 POC Automação de Testes com Cypress")
st.markdown("Envie sua planilha com os cenários de teste e execute a automação")

with st.sidebar:
    st.header("📋 Instruções")
    st.markdown("""
    1. Baixe o modelo de planilha
    2. Preencha com seus cenários
    3. Faça o upload
    4. Execute os testes
    5. Baixe o relatório
    """)

    modelo = pd.DataFrame({
        "cenario": ["Login com sucesso", "Login com email inválido"],
        "email": ["admin@email.com", "invalido@"],
        "senha": ["123456", "123456"],
        "resultado_esperado": ["sucesso", "erro"],
        "mensagem_esperada": ["", "E-mail inválido"]
    })

    st.download_button(
        label="📥 Baixar modelo de planilha",
        data=modelo.to_csv(index=False).encode('utf-8'),
        file_name="modelo_cenarios.csv",
        mime="text/csv"
    )

uploaded_file = st.file_uploader(
    "📊 Escolha sua planilha",
    type=['xlsx', 'xls', 'csv']
)

if uploaded_file is not None:
    # ✅ FE-001 FIX: estado dos resultados sobrevive ao rerun do Streamlit
    if 'resultados' not in st.session_state:
        st.session_state.resultados = None

    if uploaded_file.name.endswith('.csv'):
        df = pd.read_csv(uploaded_file)
    else:
        df = pd.read_excel(uploaded_file)

    st.success(f"✅ Planilha carregada! {len(df)} cenários encontrados.")

    with st.expander("🔍 Visualizar planilha"):
        st.dataframe(df, use_container_width=True)

    if st.button("🚀 Executar Testes", type="primary", use_container_width=True):
        progress = st.progress(0)
        status = st.empty()

        status.text("📤 Enviando planilha...")
        progress.progress(25)

        try:
            BACKEND_URL = "http://localhost:3000/api/upload-and-run"

            response = requests.post(
                BACKEND_URL,
                files={'planilha': (uploaded_file.name, uploaded_file.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            )

            status.text("⚙️ Executando testes...")
            progress.progress(50)

            if response.status_code == 200:
                resultados = response.json()

                status.text("📊 Processando resultados...")
                progress.progress(75)

                # ✅ FE-001 FIX: guarda no session_state em vez de depender
                # só da variável local, que morre no próximo rerun
                st.session_state.resultados = resultados

                progress.progress(100)
                status.text("✅ Execução finalizada!")
                st.balloons()

            else:
                status.text("❌ Erro na execução")
                st.error(f"Erro {response.status_code}: {response.text}")

        except requests.exceptions.ConnectionError:
            status.text("❌ Erro de conexão")
            st.error("Nao foi possivel conectar ao servidor! Verifique se o back-end esta rodando.")
            st.info("Execute: node backend/server.js")
        except Exception as e:
            status.text("❌ Erro")
            st.error(f"Erro inesperado: {str(e)}")

    # ============================================
    # ✅ FE-001 FIX: bloco de exibição MOVIDO para fora do
    # if st.button("Executar Testes"), controlado por session_state.
    # Assim ele sobrevive ao rerun disparado pelo botão de relatório.
    # ============================================
    if st.session_state.resultados:
        resultados = st.session_state.resultados

        st.markdown("---")
        st.header("📊 Resultados da Execução")

        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("📊 Total", resultados.get('total', 0))
        with col2:
            st.metric("✅ Passaram", resultados.get('passed', 0))
        with col3:
            st.metric("❌ Falharam", resultados.get('failed', 0))

        if 'details' in resultados:
            st.subheader("📋 Detalhes dos Cenários")
            st.dataframe(pd.DataFrame(resultados['details']), use_container_width=True)

        st.markdown("---")
        st.subheader("📄 Baixar Relatório")

        col_download1, col_download2 = st.columns(2)

        with col_download1:
            if st.button("📊 Gerar Relatório HTML"):
                with st.spinner("🔄 Gerando relatório..."):
                    try:
                        report_response = requests.get('http://localhost:3000/api/generate-report')
                        if report_response.status_code == 200:
                            html_content = report_response.text
                            st.download_button(
                                label="✅ Clique aqui para baixar o relatório HTML",
                                data=html_content.encode('utf-8'),
                                file_name=f"relatorio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html",
                                mime="text/html"
                            )
                        else:
                            st.error(f"Erro {report_response.status_code}")
                    except requests.exceptions.ConnectionError:
                        st.error("❌ Erro de conexão com o servidor back-end")
                    except Exception as e:
                        st.error(f"❌ Erro: {str(e)}")

        with col_download2:
            try:
                with open('reports/results.json', 'r') as f:
                    json_data = f.read()
                st.download_button(
                    label="📥 Baixar JSON",
                    data=json_data,
                    file_name=f"relatorio_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json",
                    mime="application/json"
                )
            except FileNotFoundError:
                st.warning("⚠️ Nenhum relatório JSON disponível. Execute os testes primeiro.")