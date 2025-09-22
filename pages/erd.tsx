import Head from "next/head";

export default function ERD() {
  return (
    <>
      <Head>
        <title>ERD図</title>
      </Head>
      <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <h1>🗂 ERD図</h1>
        <p>最新のERD図は以下のリンクから参照できます。</p>

        <ul>
          <li>
            <a
              href="https://mermaid.live/edit#pako:eNqtWFlv4zYQ_iuCgAVaIEl9JNnEQB9cZ9MGu0iMTfrSpiBokZK4lkiVpJI4x3_vUIdN6rCTNIsAsmZ4zHzzzaF98gNBqD_xqTxjOJI4veWe9-mT92v9z_v-23S2eTXqXFGpvCfzE15yRjz4m38t35WWjEceznWMMinuGKHS0SSMU6TyhSOkKWaJI8mwUvdCEhRjFTsacz3Sq4w6UqWxzlUp0iyl8J5m-tFLsNIoERHjCOu2OpAUa0o6dXlGLN3LLTcPKRK6y3mDqSPgOKXWGYUHWw8q3otl8Dy3hWbbRmgdqLzn5_198WSfPvEAvY3VXQsAZhZxSsqDnMjPptc3buQDANO1ubZx_nXv3AWBMJUleIVq3z3PoAmPBZM6Nr9LKePaPHDkQoYJkVQplxOx4LSPNwshEnMJyJdILB0hoIDoQ0YlozxwTwCOhgwghbO1QLmsTtP0wZjFRW3mu0ljR-f5uYJw4t36w8nw1i9hN0LYARYtcr2DFcVaixUFfjFlUaxRkLo8TISO4QdS7NFGW8WCFrL1hgInyCAthCXgFBzJWLDMs7Uzpf0Vk5p2V3xbu5RJGlJpMH-HT4QqJsGAWEBUVh2KVHAd15p1OM2NRkvwSvWoTLzQAnPSo8cQX5sGBsFYZMiwQTmKWtADje1_E5sFDpaRFDknb8OmsjYW9yg0ux1pKjS7w5oJ7oiBBpCmkGI8YNRFBVxVgqMgFkI1KqpxWdGEBuY8lAkAf5uztkOWs05Juf7jan7t1hRzza6CuqkhdqwCnUtXHDC96qoiyDSdHaUEwJH0AxpEAZuk_6IlXZkGtj26xep2dKu9a7RLkCq02zf0wX35u_eTic2-uIcS_3O7mCMevY1924xWkKiN6lqyaxeqPYQytq07mINAU91yfDqff7uYTW8uri6vvV-8s6tZg3U4yxIWFJmys5vHmHOavGrakDSg7K6HLnAnDEQ9Skl_AKEtZdnt6R2j95C7sCwMAXPHijBPEtTKjTCXLMIcv6Ppbm2wdV-vqu-mSHZ2XlMg__6nzCrlXFrW86IfB9qqVXXLjdp11myl0kDh6P5PmloEQEQE27PAXtzmPWzvmEfHJj0bRKLBUuVpl4WJwKRvagDCO3Sd1N62iNxeXfrWX44vzm9Mgsy_TYtEmd7cfLk8m17OvjSLNAv1B1QK22l4St0ZMMo3gTSkuQeeIpjeilFgI5aAAYKhzVzyqux849zmVKQKge565Co340-C-dtAsy2qE60fp3qFjVfvMNM3ohQ2WpbDOAfn4TfPbDvjXdAf9X2HFUqR66YjKdWxIFahCQQPmUwp6XbKNr87WB0r2olx1ZxSBHxB3FH-4UkAR7olH7oNSSBui1Uvp9fQKFVV8A6-bgzu4WxrQbuL_nl20fgCxDlhxff0joIZaCFR9XHoTmRBazoFG9ZzW7G7FKx3_oARYgHfk2H4qkHCLZwbe62y6e_5kWTEn2iZ0z0_pRLaHLz6hU-3PozL0FR985VGsFyaz7QX2JNh_pcQab0NZt0o9ichThS8lQWk-l-UtRSGf0LlDKZi7U9Oh8PPxSn-5Ml_8Cfjk4PD8WAwGo4Hh0ej4ehkz1_BqsHB-PDw6GR8cnR8Cn-jlz3_sbh2cHByejwawOrh4PPx8fFg9PIfnID46g"
              target="_blank"
              rel="noopener noreferrer"
            >
              ✏️ Mermaid Live Editor（編集用）
            </a>
          </li>
          <li>
            <a
              href="https://mermaidchart.com/play?utm_source=mermaid_live_editor&utm_medium=share#pako:eNqtWFlv4zYQ_iuCgAVaIEl9JNnEQB9cZ9MGu0iMTfrSpiBokZK4lkiVpJI4x3_vUIdN6rCTNIsAsmZ4zHzzzaF98gNBqD_xqTxjOJI4veWe9-mT92v9z_v-23S2eTXqXFGpvCfzE15yRjz4m38t35WWjEceznWMMinuGKHS0SSMU6TyhSOkKWaJI8mwUvdCEhRjFTsacz3Sq4w6UqWxzlUp0iyl8J5m-tFLsNIoERHjCOu2OpAUa0o6dXlGLN3LLTcPKRK6y3mDqSPgOKXWGYUHWw8q3otl8Dy3hWbbRmgdqLzn5_198WSfPvEAvY3VXQsAZhZxSsqDnMjPptc3buQDANO1ubZx_nXv3AWBMJUleIVq3z3PoAmPBZM6Nr9LKePaPHDkQoYJkVQplxOx4LSPNwshEnMJyJdILB0hoIDoQ0YlozxwTwCOhgwghbO1QLmsTtP0wZjFRW3mu0ljR-f5uYJw4t36w8nw1i9hN0LYARYtcr2DFcVaixUFfjFlUaxRkLo8TISO4QdS7NFGW8WCFrL1hgInyCAthCXgFBzJWLDMs7Uzpf0Vk5p2V3xbu5RJGlJpMH-HT4QqJsGAWEBUVh2KVHAd15p1OM2NRkvwSvWoTLzQAnPSo8cQX5sGBsFYZMiwQTmKWtADje1_E5sFDpaRFDknb8OmsjYW9yg0ux1pKjS7w5oJ7oiBBpCmkGI8YNRFBVxVgqMgFkI1KqpxWdGEBuY8lAkAf5uztkOWs05Juf7jan7t1hRzza6CuqkhdqwCnUtXHDC96qoiyDSdHaUEwJH0AxpEAZuk_6IlXZkGtj26xep2dKu9a7RLkCq02zf0wX35u_eTic2-uIcS_3O7mCMevY1924xWkKiN6lqyaxeqPYQytq07mINAU91yfDqff7uYTW8uri6vvV-8s6tZg3U4yxIWFJmys5vHmHOavGrakDSg7K6HLnAnDEQ9Skl_AKEtZdnt6R2j95C7sCwMAXPHijBPEtTKjTCXLMIcv6Ppbm2wdV-vqu-mSHZ2XlMg__6nzCrlXFrW86IfB9qqVXXLjdp11myl0kDh6P5PmloEQEQE27PAXtzmPWzvmEfHJj0bRKLBUuVpl4WJwKRvagDCO3Sd1N62iNxeXfrWX44vzm9Mgsy_TYtEmd7cfLk8m17OvjSLNAv1B1QK22l4St0ZMMo3gTSkuQeeIpjeilFgI5aAAYKhzVzyqux849zmVKQKge565Co340-C-dtAsy2qE60fp3qFjVfvMNM3ohQ2WpbDOAfn4TfPbDvjXdAf9X2HFUqR66YjKdWxIFahCQQPmUwp6XbKNr87WB0r2olx1ZxSBHxB3FH-4UkAR7olH7oNSSBui1Uvp9fQKFVV8A6-bgzu4WxrQbuL_nl20fgCxDlhxff0joIZaCFR9XHoTmRBazoFG9ZzW7G7FKx3_oARYgHfk2H4qkHCLZwbe62y6e_5kWTEn2iZ0z0_pRLaHLz6hU-3PozL0FR985VGsFyaz7QX2JNh_pcQab0NZt0o9ichThS8lQWk-l-UtRSGf0LlDKZi7U9Oh8PPxSn-5Ml_8Cfjk4PD8WAwGo4Hh0ej4ehkz1_BqsHB-PDw6GR8cnR8Cn-jlz3_sbh2cHByejwawOrh4PPx8fFg9PIfnID46g"
              target="_blank"
              rel="noopener noreferrer"
            >
              👀 Mermaid Chart Playground（閲覧用）
            </a>
          </li>
        </ul>
      </main>
    </>
  );
}
