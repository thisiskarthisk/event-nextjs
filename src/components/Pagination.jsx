import { useEffect, useState } from "react";
import Tooltip from "./Tooltip";
import AppIcon from "./icon";

function Pagination({totalPages, currentPage, setCurrentPageNoFn}) {
  const [ isBtnPrevEnabled, toggleBtnPrev ] = useState(false);
  const [ isBtnNextEnabled, toggleBtnNext ] = useState(false);

  const buttonsPerBatch = 5;
  const [ currentBatch, setCurrentBatch ] = useState([]);

  useEffect(() => {
    let newBatch = [];
    let pageBatchStart = ((Math.ceil(currentPage / buttonsPerBatch) - 1) * buttonsPerBatch) + 1;
    let pageBatchEnd = pageBatchStart + buttonsPerBatch - 1;

    if (pageBatchEnd > totalPages) {
      pageBatchEnd = totalPages;
    }

    for(let i = pageBatchStart; i <= pageBatchEnd; i++) {
      newBatch.push(i);
    }

    setCurrentBatch([...newBatch]);

    toggleBtnNext(currentPage < totalPages);

    toggleBtnPrev(currentPage > 1);
  }, [totalPages, currentPage]);

  const onPageNoClicked = (e, pageNo) => {
    e.preventDefault();

    document.activeElement.blur();

    // debugPrint('onPageNoClicked() -> Setting new page no', pageNo);

    setCurrentPageNoFn(pageNo);
  };

  const onBtnStartClicked = (e) => {
    e.preventDefault();

    document.activeElement.blur();

    setCurrentPageNoFn(1);
  };

  const onBtnPrevClicked = (e) => {
    e.preventDefault();

    document.activeElement.blur();

    // debugPrint('onBtnPrevClicked() -> Setting new page no', currentPage - 1);

    setCurrentPageNoFn(currentPage - 1);
  };

  const onBtnNextClicked = (e) => {
    e.preventDefault();

    document.activeElement.blur();

    // debugPrint('onBtnNextClicked() -> Setting new page no', currentPage + 1);

    setCurrentPageNoFn(currentPage + 1);
  };

  const onBtnEndClicked = (e) => {
    e.preventDefault();

    document.activeElement.blur();

    setCurrentPageNoFn(totalPages);
  };

  return (
    <>
      <ul className="pagination pagination-sm m-0 float-right">
        <li className="page-item">
          <Tooltip type="btn" className={"page-link " + (isBtnPrevEnabled ? '' : 'disabled')} onClick={onBtnStartClicked} title="First Page">
            <AppIcon ic="chevron-double-left" />
          </Tooltip>
        </li>

        <li className="page-item">
          <Tooltip type="btn" className={"page-link " + (isBtnPrevEnabled ? '' : 'disabled')} onClick={onBtnPrevClicked} title="Previous Page">
            <AppIcon ic="chevron-left" />
          </Tooltip>
        </li>
        {
          currentBatch.length > 0 && currentBatch.map((pageNo, i) => {
            return (
              <li key={`page-${i}`} className={"page-item " + (currentPage == pageNo ? 'active' : '')}>
                <a className="page-link" onClick={e => onPageNoClicked(e, pageNo)} href="#" data-page-no={pageNo}>{pageNo}</a>
              </li>
            );
          })
        }
        {
          currentBatch.length == 0 &&
          <li className="page-item disabled">
            <a className="page-link" href="#">1</a>
          </li>
        }
        <li className="page-item">
          <Tooltip type="btn" className={"page-link " + (isBtnNextEnabled ? '' : 'disabled')} onClick={onBtnNextClicked} title="Next Page">
            <AppIcon ic="chevron-right" />
          </Tooltip>
        </li>
        <li className="page-item">
          <Tooltip type="btn" className={"page-link " + (isBtnNextEnabled ? '' : 'disabled')} onClick={onBtnEndClicked} title="Last Page">
            <AppIcon ic="chevron-double-right" />
          </Tooltip>
        </li>
      </ul>
    </>
  );
}

export default Pagination;
