import {
  useEffect,
  useMemo,
  useRef,
  useState,
  WheelEvent,
  MouseEvent,
  Fragment,
} from "react";
import HighlightCell from "./HighLightCell";
import EditCell from "./EditCell";
import ColumnResizer from "./ColumnResizer";
import RowResizer from "./RowResizer";
import SeachBox from "./SearchBox";
import { convertToTitle } from "@/utils";
import { data } from "../data";

import {
  ICell,
  IColumn,
  IRow,
  IRenderGrid,
  IColumnDetails,
  IRowDetails,
  ICellDetails,
  IPaintCell,
  IPaintCellLine,
  IPaintCellHtml,
  IPaintRect,
} from "@/types/Sheets";
import HighLightColumn from "./HighLightColumn";
import HighLightRow from "./HighLightRow";

const colWidth = 46;
const rowHeight = 25;

const cell = {
  width: 100,
  height: 25,
};

const Grid = () => {
  const [rows, setRows] = useState<IRow[]>([]);

  const [columns, setColumns] = useState<IColumn[]>([]);

  const [cells, setCells] = useState<ICell[]>([]);

  const [selectedCellId, setSelectedCellId] = useState("");

  const [selectedColumnId, setSelectedColumnId] = useState(Infinity);

  const [selectedRowId, setSelectedRowId] = useState(Infinity);

  const [editCell, setEditCell] = useState<ICell | null>(null);

  const [refresh, forceUpdate] = useState(0);

  const { current: rowDetails } = useRef<IRowDetails>({});

  const { current: columnDetails } = useRef<IColumnDetails>({});

  const { current: cellDetails } = useRef<ICellDetails>({});

  const gridRef = useRef<HTMLDivElement>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedCell = useMemo(() => {
    return cells.find(({ cellId }) => cellId === selectedCellId);
  }, [rows, columns, selectedCellId]);

  const selectedRow = useMemo(() => {
    return rows.find(({ rowId }) => rowId === selectedRowId);
  }, [rows, selectedRowId]);

  const selectedColumn = useMemo(() => {
    return columns.find(({ columnId }) => columnId === selectedColumnId);
  }, [columns, selectedColumnId]);

  useEffect(() => {
    if (!gridRef.current || !canvasRef.current) return;

    let canvas = canvasRef.current;

    let { clientWidth, clientHeight } = gridRef.current;

    canvas.width = clientWidth;
    canvas.height = clientHeight;

    getSheetDetails();
  }, []);

  const getSheetDetails = () => {
    let { rows, cells, columns } = data;

    for (let row of rows) {
      rowDetails[row.rowId] = row;
    }

    for (let column of columns) {
      columnDetails[column.columnId] = column;
    }

    for (let cell of cells) {
      let id = `${cell.columnId},${cell.rowId}`;
      cellDetails[id] = cell;
    }
  };

  useEffect(() => {
    handleResizeGrid();
  }, [refresh]);

  useEffect(() => {
    window.addEventListener("resize", handleResizeGrid);

    return () => {
      window.removeEventListener("resize", handleResizeGrid);
    };
  }, [rows, columns]);

  const handleResizeGrid = () => {
    if (!gridRef.current || !canvasRef.current) return;

    let { clientWidth, clientHeight } = gridRef.current;

    let canvas = canvasRef.current;
    canvas.width = clientWidth;
    canvas.height = clientHeight;

    let { rowId = 1, y = rowHeight } = rows[0] ?? {};
    let { columnId = 1, x = colWidth } = columns[0] ?? {};

    renderGrid({
      offsetX: x,
      offsetY: y,
      rowStart: rowId,
      colStart: columnId,
    });
  };

  const paintRow = (
    ctx: CanvasRenderingContext2D,
    { height, rowId, width, x, y }: IRow
  ) => {
    ctx.clearRect(x, y, width, height);

    paintRect(ctx, "#FFFFFF", { height, width, x, y });

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + width, y);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.strokeStyle = "#D5D5D5";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "12px Open-Sans";
    ctx.fillStyle = "#575a5a";
    ctx.fillText(rowId.toString(), x + width / 2 + 1, y + height / 2 + 1);
    ctx.restore();
  };

  const paintColumn = (
    ctx: CanvasRenderingContext2D,
    { columnId, height, width, x, y }: IColumn
  ) => {
    ctx.clearRect(x, y, width, height);

    paintRect(ctx, "#FFFFFF", { height, width, x, y });

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.strokeStyle = "#D5D5D5";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "12px Open-Sans";
    ctx.fillStyle = "#575a5a";
    ctx.fillText(
      convertToTitle(columnId),
      x + width / 2 + 1,
      y + height / 2 + 1
    );
    ctx.restore();
  };

  const paintRect: IPaintRect = (
    ctx,
    backgroundColor,
    { x, y, height, width }
  ) => {
    ctx.save();
    ctx.fillStyle = backgroundColor;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.fillRect(x, y, width, height);
    ctx.fill();
    ctx.restore();
  };

  const paintCellLine: IPaintCellLine = (ctx, { height, width, x, y }) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width, y);
    ctx.strokeStyle = "#D5D5D5";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  };

  const paintCellHtml: IPaintCellHtml = (
    ctx,
    html,
    { height, width, x, y }
  ) => {
    ctx.font = "14px Open-Sans";
    ctx.beginPath();
    ctx.fillText(html, x, y + 14);
  };

  const paintCell: IPaintCell = (
    ctx,
    { cellId, rowId, columnId, height, width, x, y }
  ) => {
    let {
      backgroundColor = "#FFFFFF",
      color = "#000000",
      html = "",
    } = cellDetails[cellId] ?? {};

    let rect = { x, y, width, height };

    ctx.clearRect(x, y, width, height);

    paintRect(ctx, backgroundColor, rect);
    paintCellHtml(ctx, html, rect);
    paintCellLine(ctx, rect);
  };

  const paintBox = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.clearRect(0, 0, colWidth, rowHeight);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, colWidth, rowHeight);
    ctx.strokeStyle = "#D5D5D5";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, colWidth, rowHeight);
    ctx.stroke();
    ctx.restore();
  };

  const renderGrid: IRenderGrid = ({
    offsetX,
    offsetY,
    rowStart,
    colStart,
  }) => {
    if (!gridRef.current || !canvasRef.current) return;

    let ctx = canvasRef.current.getContext("2d")!;
    let { clientWidth, clientHeight } = gridRef.current;

    let rowData: IRow[] = [];
    let columnData: IColumn[] = [];
    let cellData: ICell[] = [];

    for (let i = rowStart, y = offsetY; y < clientHeight; i++) {
      let height = rowDetails[i]?.height || cell.height;

      if (y + height > rowHeight) {
        rowData.push({
          y,
          x: 0,
          rowId: i,
          height: height,
          width: colWidth,
        });
      }

      y += height;
    }

    for (let i = colStart, x = offsetX; x < clientWidth; i++) {
      let width = columnDetails[i]?.width || cell.width;

      if (x + width > colWidth) {
        columnData.push({
          x,
          y: 0,
          columnId: i,
          width,
          height: rowHeight,
        });
      }

      x += width;
    }

    for (let { rowId, height, y } of rowData) {
      for (let { width, x, columnId } of columnData) {
        let cellId = `${columnId},${rowId}`;

        cellData.push({
          x,
          y,
          rowId,
          columnId,
          width,
          height,
          cellId,
        });

        paintCell(ctx, cellData.at(-1)!);
      }
    }

    for (let row of rowData) {
      paintRow(ctx, row);
    }

    for (let column of columnData) {
      paintColumn(ctx, column);
    }

    paintBox(ctx);

    setRows(rowData);
    setColumns(columnData);
    setCells(cellData);
  };

  const handleClickGrid = (event: MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;

    let x = event.pageX;
    let y = event.pageY - gridRef.current.getBoundingClientRect().top;

    let cellId = getCellIdByCoordiantes(x, y);

    if (!cellId) return;

    setSelectedCellId(cellId);
    setEditCell(null);
    setSelectedColumnId(Infinity);
    setSelectedRowId(Infinity);
  };

  const getCellIdByCoordiantes = (x: number, y: number) => {
    let left = 0;
    let right = rows.length - 1;
    let rowId = null;

    while (left <= right) {
      let mid = Math.floor((left + right) / 2);

      if (rows[mid].y <= y) {
        left = mid + 1;
        rowId = rows[mid].rowId;
      } else {
        right = mid - 1;
      }
    }

    if (!rowId) return null;

    left = 0;
    right = columns.length - 1;
    let columnId = null;

    while (left <= right) {
      let mid = Math.floor((left + right) / 2);

      if (columns[mid].x <= x) {
        left = mid + 1;
        columnId = columns[mid].columnId;
      } else {
        right = mid - 1;
      }
    }

    if (!columnId) return null;

    return `${columnId},${rowId}`;
  };

  const handleVerticalScroll = (deltaY: number) => {
    if (!rows.length || !columns.length) return;

    let { rowId, y } = rows[0];
    let { columnId, x } = columns[0];

    if (deltaY < 0) {
      // Scroll upwards
      y += -deltaY;
      rowId--;

      while (rowId > 0 && y > rowHeight) {
        y -= rowDetails[rowId]?.height ?? cell.height;
        rowId--;
      }

      renderGrid({
        offsetX: x,
        offsetY: Math.min(rowHeight, y),
        rowStart: rowId + 1,
        colStart: columnId,
      });
    } else {
      // Scroll downwards
      renderGrid({
        offsetX: x,
        offsetY: y + -deltaY,
        rowStart: rowId,
        colStart: columnId,
      });
    }
  };

  const handleHorizontalScroll = (deltaX: number) => {
    if (!rows.length || !columns.length) return;

    let { rowId, y } = rows[0];
    let { columnId, x } = columns[0];

    if (deltaX < 0) {
      // Scroll leftwards
      x += -deltaX;
      columnId--;

      while (columnId > 0 && x > colWidth) {
        x -= columnDetails[columnId]?.width ?? cell.width;
        columnId--;
      }

      renderGrid({
        offsetX: Math.min(colWidth, x),
        offsetY: y,
        rowStart: rowId,
        colStart: columnId + 1,
      });
    } else {
      // Scroll rightwards
      renderGrid({
        offsetX: x + -deltaX,
        offsetY: y,
        rowStart: rowId,
        colStart: columnId,
      });
    }
  };

  const handleScroll = (event: WheelEvent<HTMLDivElement>) => {
    let { deltaX, deltaY } = event;

    if (deltaX === 0) handleVerticalScroll(deltaY);
    else handleHorizontalScroll(deltaX);
  };

  const handleDoubleClickCell = () => {
    if (!gridRef.current || !selectedCell) return;

    let { columnId, cellId, width, height, rowId, x, y } = selectedCell;

    let { top } = gridRef.current.getBoundingClientRect();

    setEditCell({
      cellId,
      columnId,
      width,
      height,
      rowId,
      x: Math.max(colWidth, x),
      y: Math.max(rowHeight + top, y + top),
    });
  };

  const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleClickGrid(event);
  };

  const handleClickColumn = (columnId: number) => {
    setSelectedColumnId(columnId);
    setSelectedRowId(Infinity);
    setSelectedCellId("");
    setEditCell(null);
  };

  const handleClickRow = (rowId: number) => {
    setSelectedRowId(rowId);
    setSelectedColumnId(Infinity);
    setSelectedCellId("");
    setEditCell(null);
  };

  const handleResizeColumn = (columnId: number, value: number) => {
    if (!columnDetails[columnId])
      columnDetails[columnId] = { columnId, width: value };
    else columnDetails[columnId].width = value;

    forceUpdate(Math.random());
  };

  const handleResizeRow = (rowId: number, value: number) => {
    if (!rowDetails[rowId]) rowDetails[rowId] = { rowId, height: value };
    else rowDetails[rowId].height = value;

    forceUpdate(Math.random());
  };

  return (
    <Fragment>
      <div
        ref={gridRef}
        className="relative h-[var(--grid-height)] select-none overflow-hidden"
        onClick={handleClickGrid}
        onContextMenu={handleContextMenu}
        onWheel={handleScroll}
      >
        <canvas ref={canvasRef} className="relative"></canvas>
        <div className="absolute left-0 top-0 w-[var(--col-width)] h-[var(--row-height)] border-b-4 border-r-4 border-t border-l border-light-gray bg-white z-20"></div>
        <ColumnResizer
          columns={columns}
          onClick={handleClickColumn}
          onResize={handleResizeColumn}
        />
        <RowResizer
          rows={rows}
          onClick={handleClickRow}
          onResize={handleResizeRow}
        />
        {!editCell && selectedCell && (
          <HighlightCell
            selectedCell={selectedCell}
            onDoubleClick={handleDoubleClickCell}
          />
        )}
        {selectedColumn && <HighLightColumn selectedColumn={selectedColumn} />}
        {selectedRow && <HighLightRow selectedRow={selectedRow} />}
        <SeachBox cells={cells} />
        {/* <div className="absolute left-[var(--col-width)] top-[var(--row-height)] w-full h-full overflow-hidden"></div> */}
      </div>
      {editCell && (
        <EditCell
          cell={editCell}
          data={cellDetails[editCell.cellId]}
          onWheel={handleScroll}
        />
      )}
    </Fragment>
  );
};

export default Grid;
