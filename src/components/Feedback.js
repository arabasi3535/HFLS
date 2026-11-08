import { useEffect, useState } from "react";
import { sendReport, listReports, deleteReport } from "../lib/remote";
import { getUse } from "../law/uses";

const TYPES = ["판정 오류", "화면 오류", "개선 제안", "기타"];

/** 오류 신고 창 */
export function BugReportModal({ onClose, context, version }) {
  const [type, setType] = useState(context && context.input ? "판정 오류" : "화면 오류");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [attach, setAttach] = useState(!!(context && context.input));
  const [state, setState] = useState({ sending: false, done: false, error: "", unconfigured: false });

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const summary = context && context.input ? describe(context) : "";
  const text = () =>
    `[소방시설 검토 v${version}] ${type}\n${message}${contact ? `\n연락처: ${contact}` : ""}${attach && summary ? `\n\n첨부: ${summary}\n${JSON.stringify(context.input)}` : ""}`;

  const submit = async () => {
    if (message.trim().length < 5) {
      setState((s) => ({ ...s, error: "내용을 5자 이상 입력하십시오." }));
      return;
    }
    setState({ sending: true, done: false, error: "", unconfigured: false });
    const r = await sendReport({
      type,
      message,
      contact,
      version,
      page: context ? context.mode : "",
      snapshot: attach && context && context.input ? { mode: context.mode, input: context.input, result: context.result } : null,
    });
    if (r.ok) setState({ sending: false, done: true, error: "", unconfigured: false });
    else setState({ sending: false, done: false, error: r.error || "", unconfigured: !!r.unconfigured });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text());
      setState((s) => ({ ...s, error: "내용을 복사했습니다. 담당자에게 전달해 주십시오." }));
    } catch (e) {
      setState((s) => ({ ...s, error: "복사하지 못했습니다." }));
    }
  };

  return (
    <div className="modal-bg no-print" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="오류 신고" onClick={(e) => e.stopPropagation()}>
        <div className="modal-h">
          <b>오류 신고 · 의견</b>
          <button type="button" className="modal-x" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        {state.done ? (
          <div className="modal-done">
            <div className="done-t">접수되었습니다. 감사합니다.</div>
            <div className="muted small">검토 후 다음 버전에 반영합니다.</div>
            <button type="button" className="w-run" onClick={onClose}>
              닫기
            </button>
          </div>
        ) : (
          <>
            <div className="fb-types">
              {TYPES.map((t) => (
                <button key={t} type="button" className={type === t ? "on" : ""} onClick={() => setType(t)}>
                  {t}
                </button>
              ))}
            </div>
            <label className="w-field">
              <span className="w-label">
                내용<em className="req">*</em>
              </span>
              <textarea
                rows={5}
                value={message}
                maxLength={3000}
                placeholder={type === "판정 오류" ? "예: 2014년 허가 요양병원 1,500㎡인데 자동화재속보설비가 빠졌습니다. 근거: …" : "무엇이 어떻게 잘못되었는지 적어 주십시오."}
                onChange={(e) => setMessage(e.target.value)}
              />
            </label>
            <label className="w-field">
              <span className="w-label">연락처 (선택 — 회신이 필요할 때)</span>
              <input type="text" value={contact} maxLength={100} placeholder="소속·이름 또는 이메일" onChange={(e) => setContact(e.target.value)} />
            </label>
            {summary && (
              <label className="w-check">
                <input type="checkbox" checked={attach} onChange={(e) => setAttach(e.target.checked)} />
                <span>
                  현재 입력값·결과 첨부 <small className="muted">({summary})</small>
                </span>
              </label>
            )}
            <div className="fb-privacy">민원인 성명·주소 등 개인정보는 적지 마십시오.</div>
            {state.error && <div className="w-err">{state.error}</div>}
            {state.unconfigured && (
              <div className="fb-unconf">
                신고 저장소가 아직 설정되지 않았습니다.{" "}
                <button type="button" className="w-link" onClick={copy}>
                  내용 복사
                </button>
              </div>
            )}
            <div className="w-actions">
              <button type="button" className="w-run" disabled={state.sending} onClick={submit}>
                {state.sending ? "보내는 중…" : "보내기"}
              </button>
              <button type="button" className="w-reset" onClick={onClose}>
                취소
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function describe(ctx) {
  const i = ctx.input || {};
  const u = getUse(i.use);
  const parts = [ctx.mode === "existing" ? `기존(허가 ${i.date || "—"})` : "신축"];
  if (u) parts.push(u.name.replace(/\s*\(.*\)$/, ""));
  if (i.area) parts.push(`${i.area}㎡`);
  if (i.gf) parts.push(`지상 ${i.gf}층${i.bf && i.bf !== "0" ? `/지하 ${i.bf}층` : ""}`);
  return parts.join(" · ");
}

/** 관리자: 오류 신고함 */
export function ReportsTab({ adminPw, onLoadInput }) {
  const [data, setData] = useState({ loading: true, items: [], total: 0, error: "" });
  const [open, setOpen] = useState({});

  const load = async () => {
    if (!adminPw) {
      setData({ loading: false, items: [], total: 0, error: "서버 관리자 비밀번호(Vercel 환경변수 ADMIN_PW)로 로그인해야 신고함을 볼 수 있습니다. README 「사용 통계·오류 신고 설정」 참고." });
      return;
    }
    setData((d) => ({ ...d, loading: true }));
    const r = await listReports(adminPw);
    setData(r.ok ? { loading: false, items: r.items || [], total: r.total || 0, error: "" } : { loading: false, items: [], total: 0, error: r.error });
  };
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const del = async (id) => {
    if (!window.confirm("이 신고를 삭제할까요?")) return;
    if (await deleteReport(adminPw, id)) setData((d) => ({ ...d, items: d.items.filter((x) => x.id !== id), total: d.total - 1 }));
  };

  return (
    <div className="info">
      <div className="card prose">
        <div className="card-head">
          <div className="card-t">오류 신고함 {data.total ? `(${data.total}건)` : ""}</div>
          <button type="button" className="btn small" onClick={load}>
            새로고침
          </button>
        </div>
        {data.loading && <div className="muted">불러오는 중…</div>}
        {data.error && <div className="w-err">{data.error}</div>}
        {!data.loading && !data.error && data.items.length === 0 && <div className="muted">접수된 신고가 없습니다.</div>}
        {data.items.map((it) => (
          <div key={it.id} className="rp">
            <div className="rp-h">
              <span className={`tag rp-type rp-${TYPES.indexOf(it.type)}`}>{it.type}</span>
              <span className="muted small">
                {it.at} · v{it.version}
                {it.page ? ` · ${it.page === "existing" ? "기존" : it.page === "new" ? "신축" : it.page}` : ""}
              </span>
              <span className="rp-acts">
                {it.snapshot && it.snapshot.input && (
                  <button type="button" className="w-link" onClick={() => onLoadInput(it.snapshot.mode, it.snapshot.input)}>
                    입력값 불러오기
                  </button>
                )}
                <button type="button" className="w-link danger" onClick={() => del(it.id)}>
                  삭제
                </button>
              </span>
            </div>
            <div className="rp-msg">{it.message}</div>
            {it.contact && <div className="small muted">연락처: {it.contact}</div>}
            {it.snapshot && (
              <div className="small">
                <button type="button" className="w-link" onClick={() => setOpen((o) => ({ ...o, [it.id]: !o[it.id] }))}>
                  {open[it.id] ? "▾" : "▸"} 첨부 ({it.snapshot.input ? describe(it.snapshot) : "—"})
                </button>
                {open[it.id] && <pre className="rp-pre">{JSON.stringify(it.snapshot, null, 1)}</pre>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
