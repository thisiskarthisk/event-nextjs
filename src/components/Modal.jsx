// export default function Modal({title, body, footer, closeOnEsc = true, modalSize = 'medium', showNegativeBtn = false, negativeBtnText = 'Cancel', onNegativeBtnClick = () => {}}) {
//   const modalSizeClass = () => {
//     switch(modalSize) {
//       case 'small':
//         return 'modal-sm';
//       case 'large':
//         return 'modal-lg';
//       case 'extra-large':
//         return 'modal-xl';
//       default:
//         return '';
//     }
//   };

//   const onCloseButtonClicked = (e) => {
//     if (onNegativeBtnClick && typeof onNegativeBtnClick === 'function') {
//       onNegativeBtnClick(e);
//     }
//   };

//   return (
//     <>
//       <div className="modal-backdrop fade show"></div>

//       <div className="modal fade show" tabIndex="-1" aria-hidden="false" {...(!closeOnEsc ? {'data-bs-backdrop': 'static', 'data-bs-keyboard': 'false'} : {} )}>
//         <div className={"modal-dialog modal-dialog-centered modal-dialog-scrollable " + modalSizeClass()}>
//           <div className="modal-content">
//             <div className="modal-header">
//               <h1 className="modal-title fs-5" >{title}</h1>
//               <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={onCloseButtonClicked}></button>
//             </div>
//             <div className="modal-body">
//               {body}
//             </div>
//             <div className="modal-footer">
//               {footer}
//               {
//                 showNegativeBtn &&
//                 <button type="button" className="btn btn-secondary" data-bs-dismiss="modal" onClick={onCloseButtonClicked}>{negativeBtnText || 'Cancel'}</button>
//               }
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }



export default function Modal({
  title,
  body,
  footer,
  closeOnEsc = true,
  modalSize = "medium",
  showNegativeBtn = false,
  negativeBtnText = "Cancel",
  onNegativeBtnClick = () => {},
}) {

  const modalSizeClass = () => {
    switch (modalSize) {
      case "small":
        return "modal-sm";
      case "large":
        return "modal-lg";
      case "extra-large":
        return "modal-xl";
      default:
        return "";
    }
  };

  const onCloseButtonClicked = (e) => {
    if (onNegativeBtnClick && typeof onNegativeBtnClick === "function") {
      onNegativeBtnClick(e);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop fade show"></div>

      {/* Modal */}
      <div
        className="modal fade show"
        tabIndex="-1"
        aria-modal="true"
        role="dialog"
        {...(!closeOnEsc
          ? { "data-bs-backdrop": "static", "data-bs-keyboard": "false" }
          : {})}
      >
        <div
          className={
            "modal-dialog modal-dialog-centered modal-dialog-scrollable " +
            modalSizeClass()
          }
        >
          <div className="modal-content shadow-lg rounded-4">

            {/* HEADER */}
            <div className="modal-header border-bottom">
              <h5 className="modal-title fw-semibold">{title}</h5>

              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onCloseButtonClicked}
              />
            </div>

            {/* BODY */}
            <div
              className="modal-body"
              style={{
                maxHeight: "60vh",
                overflowY: "auto",
              }}
            >
              {body}
            </div>

            {/* FOOTER */}
            <div className="modal-footer border-top d-flex justify-content-end gap-2">

              {footer}

              {showNegativeBtn && (
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4"
                  onClick={onCloseButtonClicked}
                >
                  {negativeBtnText}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
