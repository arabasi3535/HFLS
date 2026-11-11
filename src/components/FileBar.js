import { useRef, useState } from "react";

/**
 * 입력 내용 저장·엑셀 서식 받기·불러오기 버튼 줄(공통)
 *  onSave / onBlank: 파일 만들어 내려받기(비동기 가능)
 *  onLoad(file): 올린 파일 처리 → 안내 문구 반환(또는 throw)
 */
export default function FileBar({ saveLabel = "입력 내용 받기(엑셀)", onSave, onSaveAll, saveAllLabel, onBlank, onLoad, accept = ".xlsx", hint, msg: msg0, setMsg: setMsg0 }) {
  const ref = useRef(null);
  const [msgL, setMsgL] = useState("");
  const [busy, setBusy] = useState(false);
  const msg = msg0 !== undefined ? msg0 : msgL;
  const setMsg = setMsg0 || setMsgL;
  const run = async (fn) => {
    setBusy(true);
    try {
      const m = await fn();
      if (typeof m === "string") setMsg(m);
    } catch (e) {
      alert((e && e.message) || "파일을 처리하지 못했습니다.");
    }
    setBusy(false);
  };
  return (
    <>
      <div className="ir-file fb">
        {onSave && (
          <button type="button" className="w-reset" disabled={busy} onClick={() => run(onSave)}>
            {saveLabel}
          </button>
        )}
        {onSaveAll && (
          <button type="button" className="w-reset" disabled={busy} onClick={() => run(onSaveAll)}>
            {saveAllLabel}
          </button>
        )}
        {onBlank && (
          <button type="button" className="w-reset" disabled={busy} onClick={() => run(onBlank)}>
            빈 서식 받기(엑셀)
          </button>
        )}
        <button type="button" className="w-reset" disabled={busy} onClick={() => ref.current && ref.current.click()}>
          불러오기
        </button>
        <input
          ref={ref}
          type="file"
          accept={accept}
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files && e.target.files[0];
            e.target.value = "";
            if (f) run(() => onLoad(f));
          }}
        />
        {hint && <span className="w-hint">{hint}</span>}
      </div>
      {msg && <div className="note fb-msg">{msg}</div>}
    </>
  );
}
