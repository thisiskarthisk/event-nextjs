import { useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import Pagination from "@/components/Pagination";
import useSWR from "swr";
import { swrFetcher } from "@/helper/http";

export default function DataTable({ref, apiPath, dataKeyFromResponse, columns = [], actionColumnFn = () => {}, additionalRequestParams = {}, paginationType = 'server'}) {
  const [ data, setData ] = useState([]);
  const [ wholeTableData, setWholeTableData ] = useState([]);

  const [ totalRecords, setTotalRecords ] = useState(0);
  const [ totalPages, setTotalPages ] = useState(1);

  const [ prevPageNo, setPrevPageNo ] = useState(1);
  const [ currentPageNo, setCurrentPageNo ] = useState(1);

  const [ pageStartIndex, setPageStartIndex ] = useState(1);
  const [ pageEndIndex, setPageEndIndex ] = useState(1);

  const pageLengthsAllowed = [
    10, 20, 50, 100,
  ];
  const [ prevPageSize, setPrevPageSize ] = useState(10);
  const [ pageSize, setPageSize ] = useState(10);

  const [ prevOrderBy, setPrevOrderBy ] = useState('');
  const [ orderBy, setOrderBy ] = useState('');

  const [ prevSearchValue, setPrevSearchValue ] = useState('');
  const [ searchValue, setSearchValue ] = useState('');
  const [ filteredRecords, setFilteredRecords ] = useState(0);
  const txtSearchRef = useRef(null);
  
  const filters = useMemo(() => ({
    'page': currentPageNo,
    'search': searchValue,
    'pageSize': pageSize,
    'order': orderBy,
    ...additionalRequestParams,
  }), [currentPageNo, searchValue, pageSize, orderBy, additionalRequestParams]);

  const [ hasFetchedOnce, setHasFetchedOnce ] = useState(false);

  const shouldFetch = paginationType === 'server' || !hasFetchedOnce;
  
  const { data: response, error, isLoading, mutate: reFetchData } = useSWR([apiPath, filters], shouldFetch ? swrFetcher : null, {
    keepPreviousData: paginationType !== 'server',
    onSuccess: () => setHasFetchedOnce(true)
  });

  const renderClientSidePagination = () => {
    let filteredData = [];

    for (let i = 0; i < wholeTableData.length; i++) {
      let isRowFiltered = false;

      if (searchValue) {
        for (let c = 0; c < columns.length; c++) {
          if (String(wholeTableData[i][columns[c].column]).toLowerCase().includes(searchValue.toLowerCase())) {
            isRowFiltered = true;
          }
        }
      } else {
        isRowFiltered = true;
      }

      if (isRowFiltered) {
        filteredData.push(wholeTableData[i]);
      }
    }

    setFilteredRecords(filteredData.length);
    setTotalPages(Math.ceil(filteredData.length / pageSize));
    setCurrentPageNo( !(searchValue) ? currentPageNo : 1 );

    setData([
      ...filteredData.slice((currentPageNo * pageSize) - pageSize, currentPageNo * pageSize),
    ]);
  };

  useEffect(() => {
    if (currentPageNo != prevPageNo) {
      if (paginationType == 'server') {
        reFetchData();
      } else {
        renderClientSidePagination();
      }

      setPrevPageNo(currentPageNo);
    }

    setPageIndexes();
  }, [currentPageNo]);

  useEffect(() => {
    setPageIndexes();
  }, [currentPageNo, pageSize, totalRecords, filteredRecords]);

  useEffect(() => {
    if (searchValue != prevSearchValue) {
      if (paginationType == 'server') {
        reFetchData();
      } else {
        renderClientSidePagination();
      }

      setPrevSearchValue(searchValue);
    }
  }, [searchValue]);

  useEffect(() => {
    if (orderBy != prevOrderBy) {
      if (paginationType == 'server') {
        reFetchData();
      } else {
        renderClientSidePagination();
      }

      setPrevOrderBy(orderBy);
    }
  }, [orderBy]);

  useEffect(() => {
    if (pageSize != prevPageSize) {
      if (paginationType == 'server') {
        reFetchData();
      } else {
        renderClientSidePagination();
      }

      setPrevPageSize(pageSize);
    }
  }, [pageSize]);

  // useImperativeHandle(ref, () => ({
  //   refreshTable() {
  //     reFetchData();
  //   }
  // }));

  useImperativeHandle(ref, () => ({
    refreshTable: async () => {
      if (paginationType === 'server') {
        try {
          await reFetchData();
        } catch (e) {
          console.error("refreshTable (server) error:", e);
        }
        return;
      }

      try {
        const fresh = await swrFetcher([apiPath, filters]);

        await reFetchData(fresh, false);

        setHasFetchedOnce(true);
      } catch (e) {
        console.error("refreshTable (client) error:", e);
      }
    }
  }));

  useEffect(() => {
    onDataFetched();
  }, [response]);

  const setPageIndexes =  () => {
    setPageStartIndex(((currentPageNo * pageSize) - pageSize) + 1);

    if ((currentPageNo * pageSize) <= (filteredRecords != totalRecords ? filteredRecords : totalRecords)) {
      setPageEndIndex(currentPageNo * pageSize);
    } else {
      setPageEndIndex(filteredRecords != totalRecords ? filteredRecords : totalRecords);
    }
  };

  const onDataFetched = () => {
    let tableData = [], totalRecords = 0, filteredRecords = 0, pageSize = 0, totalPages = 0, currentPage = 1, newWholeTableData = [];

    if (response && response.success && response.data) {
      if (response.data[dataKeyFromResponse]) {
        tableData = response.data[dataKeyFromResponse];
        newWholeTableData = response.data[dataKeyFromResponse];
      }

      if (paginationType == 'server') {
        if (response.data.total) {
          totalRecords = response.data.total;
        }
        if (response.data.filtered) {
          filteredRecords = response.data.filtered;
        }
        if (response.data.pageSize) {
          pageSize = response.data.pageSize;
        }
        if (response.data.totalPages) {
          totalPages = response.data.totalPages;
        }
        if (response.data.page) {
          currentPage = response.data.page;
        }
      } else {
        totalRecords = newWholeTableData.length;
        filteredRecords = totalRecords;
        pageSize = 10;
        totalPages = Math.ceil(totalRecords / pageSize);
        currentPage = 1;
        tableData = newWholeTableData.slice(0, pageSize);
      }
    }

    setWholeTableData([...newWholeTableData]);

    setData([...tableData]);

    setTotalRecords(totalRecords);

    setTotalPages(totalPages);
    setCurrentPageNo(currentPage);
    setPageSize(pageSize);

    setFilteredRecords(filteredRecords);
  };

  const onBtnClearSearchValueClicked = (e) => {
    e.preventDefault();

    document.activeElement.blur();

    setSearchValue('');

    if (txtSearchRef.current) {
      txtSearchRef.current.focus();
    }
  };

  const onSearchInputChanged = (e) => {
    setSearchValue(e.target.value);
  };

  const onTHClicked = (e, columnName) => {
    e.preventDefault();

    if (e.target.classList.contains('is-orderable')) {
      let newOrderBy = '';

      if (orderBy.includes(`:${columnName}`)) {
        if (orderBy.includes('asc:')) {
          newOrderBy = `desc:${columnName}`;
        } else {
          newOrderBy = `asc:${columnName}`;
        }
      } else {
        newOrderBy = `asc:${columnName}`;
      }

      setOrderBy(newOrderBy);
    }
  };

  const onPageSizeDropdownChanged = (e) => {
    document.activeElement.blur();

    if (e.target.value && pageLengthsAllowed.includes(Number(e.target.value))) {
      setPageSize(e.target.value);
    }
  };

  return (
    <>
      <div className="row">
        <div className="col-lg-3">
          Show&nbsp;
          <select className="form-control inline-form-control" value={pageSize} onChange={onPageSizeDropdownChanged}>
            {
              pageLengthsAllowed.map((pL, i) => {
                return (
                  <option key={i} value={pL}>{pL}</option>
                );
              })
            }
          </select>
          &nbsp;Records
        </div>

        <div className="col-lg-6"></div>

        <div className="col-lg-3">
          <div className="text-box-with-floating-btn">
            <input type="text" className="form-control"  placeholder="Search" ref={txtSearchRef} value={searchValue} onInput={e => onSearchInputChanged(e)} autoComplete="off" />
            {
              (searchValue && searchValue.length > 0) &&
              <a href="#" className="btn-floating" title="Clear" tabIndex="-1" onClick={onBtnClearSearchValueClicked}>
                <i className="fas fa-times"></i>
              </a>
            }
          </div>
        </div>
      </div>

      <div className="row mt-3">
        <div className="col-12">
          <div className="table-responsive">
            <table className="table table-striped app-data-table">
              <thead>
                <tr>
                  {
                    columns.map((col, i) => {
                      return (
                        <th
                          key={`th-${i}`}
                          className={
                            col.order === false ? "" : "is-orderable " + (
                              orderBy.includes(`:${col.column}`) ? (orderBy.includes('asc:') ? 'is-ordered-asc' : 'is-ordered-desc') : ''
                            ) + " " + (
                              col.align == 'right' ? 'text-right' : (col.align == 'center' ? 'text-center' : 'text-left')
                            )
                          }
                          style={
                            {
                              ...(
                                col.width ? {
                                  width: col.width,
                                } : {}
                              ),
                            }
                          }
                          onClick={e => onTHClicked(e, col.column)}>
                          {
                            col.label.replace('<br>', '\n')
                          }
                        </th>
                      );
                    })
                  }
                  {
                    actionColumnFn &&
                    <th className="td-action">Action</th>
                  }
                </tr>
              </thead>
              <tbody>
                {
                  isLoading &&
                  <tr>
                    <td colSpan={columns.length + 1} className="text-center">Loading...</td>
                  </tr>
                }
                {
                  !isLoading && (data && data.length > 0) &&
                  data.map((rowData, i) => {
                    return (
                      <tr key={`tr-${i}`}>
                        {
                          columns.map((col, j) => {
                            return (
                              <td
                                key={`td-${i}-${j}`}
                                className={
                                  " " + (
                                    col.align == 'right' ? 'text-right' : (col.align == 'center' ? 'text-center' : 'text-left')
                                  )
                                }
                                style={(col.width ? {
                                  width: col.width,
                                } : {})}>
                                {
                                  typeof(col.renderFn) === 'function' ? col.renderFn(rowData, col) : rowData[col.column]
                                }
                              </td>
                            );
                          })
                        }
                        {
                          actionColumnFn &&
                          <td className="td-action">
                            {
                              actionColumnFn(rowData)
                            }
                          </td>
                        }
                      </tr>
                    );
                  })
                }
                {
                  !isLoading && !(data && data.length > 0) &&
                  <tr>
                    <td colSpan={columns.length + 1} className="text-center">No Data Found</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {
        (data && data.length > 0) &&
        <div className="row mt-3">
          <div className="col-lg-6 col-12">
            <div>
              Showing {pageStartIndex} to {pageEndIndex} of {filteredRecords != totalRecords ? filteredRecords : totalRecords} records
              {
                filteredRecords != totalRecords &&
                <>&nbsp;(Filtered {filteredRecords} out of {totalRecords})</>
              }
            </div>
          </div>

          <div className="col-lg-6 col-12">
            <Pagination
              totalPages={totalPages}
              currentPage={currentPageNo}
              setCurrentPageNoFn={setCurrentPageNo} />
          </div>
        </div>
      }
    </>
  );
}