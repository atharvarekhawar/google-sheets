import {
  useEffect,
  useMemo,
  useRef,
  useState,
  WheelEvent,
  MouseEvent,
  Fragment,
} from "react";
import ToolBar from "./ToolBar";
import HighlightCell from "./HighLightCell";
import EditCell from "./EditCell";
import ColumnResizer from "./ColumnResizer";
import RowResizer from "./RowResizer";
import SeachBox from "./SearchBox";
import { convertToTitle } from "@/utils";
import { data } from "./data";

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
  IRect,
} from "@/types/Sheets";
import HighLightSearch from "./HighLightSearch";
import HighLightColumn from "./HighLightColumn";
import HighLightRow from "./HighLightRow";
import ColumnOverLay from "./ColumnOverLay";
import RowOverLay from "./RowOverLay";
import ContextMenu from "./ContextMenu";
import FormularBar from "./FormulaBar";

const config = {
  lineWidth: 2,
  strokeStyle: "#C4C7C5",
  cellHeight: 25,
  cellWidth: 100,
  colWidth: 46,
  rowHeight: 25,
};

const Grid = () => {
  const [rows, setRows] = useState<IRow[]>([]);

  const [columns, setColumns] = useState<IColumn[]>([]);

  const [cells, setCells] = useState<ICell[]>([]);

  const [selectedCellId, setSelectedCellId] = useState("");

  const [selectedColumnId, setSelectedColumnId] = useState(Infinity);

  const [selectedRowId, setSelectedRowId] = useState(Infinity);

  const [editCell, setEditCell] = useState<ICell | null>(null);

  const [activeSearchIndex, setActiveSearchIndex] = useState(0);

  const [highLightCellIds, setHighLightCellIds] = useState<string[]>([]);

  const [showSearch, setShowSearch] = useState(false);

  const [contextMenuPosition, setContextMenuPositon] = useState<Pick<
    IRect,
    "x" | "y"
  > | null>(null);

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
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!gridRef.current || !canvasRef.current) return;

    let canvas = canvasRef.current;

    let { clientWidth, clientHeight } = gridRef.current;

    canvas.width = clientWidth;
    canvas.height = clientHeight;

    getSheetDetails();
  }, []);

  useEffect(() => {
    handleResizeGrid();
  }, [refresh]);

  useEffect(() => {
    window.addEventListener("resize", handleResizeGrid);

    return () => {
      window.removeEventListener("resize", handleResizeGrid);
    };
  }, [rows, columns]);

  useEffect(() => {
    paintRows(rows);
    paintColumns(columns);
  }, [selectedCellId, selectedColumnId, selectedRowId]);

  const handleKeyDown = (event: Event) => {
    let { ctrlKey, key } = event as KeyboardEvent;

    if (ctrlKey && key === "f" && !showSearch) {
      event.preventDefault();
      setShowSearch(true);
    }
  };

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

  const handleResizeGrid = () => {
    if (!gridRef.current || !canvasRef.current) return;

    let { clientWidth, clientHeight } = gridRef.current;

    let canvas = canvasRef.current;
    canvas.width = clientWidth;
    canvas.height = clientHeight;

    let { rowId = 1, y = config.rowHeight } = rows[0] ?? {};
    let { columnId = 1, x = config.colWidth } = columns[0] ?? {};

    renderGrid({
      offsetX: x,
      offsetY: y,
      rowStart: rowId,
      colStart: columnId,
    });
  };

  const paintRow = (
    ctx: CanvasRenderingContext2D,
    highlight: boolean,
    { height, rowId, width, x, y }: IRow
  ) => {
    paintRect(ctx, highlight ? "#D3E3FD" : "#FFFFFF", { height, width, x, y });

    ctx.save();
    ctx.strokeStyle = config.strokeStyle;
    ctx.lineWidth = config.lineWidth;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = highlight ? "12px Open-Sans-Medium" : "12px Open-Sans";
    ctx.fillStyle = highlight ? "#000000" : "#575a5a";
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();
    ctx.fillText(rowId.toString(), x + width / 2 + 1, y + height / 2 + 1);
    ctx.restore();
  };

  const paintColumn = (
    ctx: CanvasRenderingContext2D,
    highlight: boolean,
    { columnId, height, width, x, y }: IColumn
  ) => {
    paintRect(ctx, highlight ? "#D3E3FD" : "#FFFFFF", { height, width, x, y });
    ctx.save();
    ctx.strokeStyle = config.strokeStyle;
    ctx.lineWidth = config.lineWidth;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = highlight ? "12px Open-Sans-Medium" : "12px Open-Sans";
    ctx.fillStyle = highlight ? "#000000" : "#575a5a";
    ctx.beginPath();
    ctx.moveTo(x + width, y);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();
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
    ctx.strokeStyle = config.strokeStyle;
    ctx.lineWidth = config.lineWidth;
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    ctx.restore();
  };

  const paintCellHtml: IPaintCellHtml = (
    ctx,
    html,
    { height, width, x, y }
  ) => {
    if (!html) return;

    let node = document.createElement("div");
    node.innerHTML = html;

    type IText = {
      fontSize: string;
      fontWeight: string;
      fontStyle: string;
      fontFamily: string;
      lineThrough: boolean;
      color: string;
      text: string;
    };

    type ILine = {
      y: number;
      texts: IText[];
    };

    let lines: ILine[] = [{ y: -Infinity, texts: [] }];

    for (let element of node.children) {
      if (element.tagName === "BR") {
        lines.push({ y: -Infinity, texts: [] });
        continue;
      }

      let {
        style: {
          fontSize,
          fontFamily,
          fontStyle,
          fontWeight,
          color,
          textDecoration,
        },

        innerText,
      } = element as HTMLElement;

      let data: IText = {
        fontStyle: fontStyle || "normal",
        fontWeight: fontWeight || "normal",
        fontSize: fontSize || "14px",
        fontFamily: fontFamily || "Open-Sans",
        lineThrough: textDecoration === "line-through",
        color: color || "#000000",
        text: innerText,
      };

      let line = lines.at(-1)!;

      line.y = Math.max(
        lines.at(-1)!.y,
        fontSize ? +fontSize.replace("px", "") : 14
      );

      line.texts.push(data);
    }

    let offsetY = y;

    for (let { texts, y } of lines) {
      let offsetX = x;
      offsetY += y;

      for (let {
        color,
        fontFamily,
        fontSize,
        fontStyle,
        fontWeight,
        lineThrough,
        text,
      } of texts) {
        ctx.save();
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;
        ctx.fillStyle = color;
        let { width } = ctx.measureText(text);
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        ctx.fillText(text, offsetX, offsetY);
        ctx.fill();

        if (lineThrough) {
          let offset = lineThrough ? +fontSize.replace("px", "") / 4 : -2;
          ctx.beginPath();
          ctx.moveTo(offsetX, offsetY - offset);
          ctx.lineTo(offsetX + width, offsetY - offset);
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "#000000";
          ctx.stroke();
        }

        ctx.restore();
        offsetX += width;
      }
    }
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

    paintRect(ctx, backgroundColor, rect);
    paintCellHtml(ctx, html, rect);
    paintCellLine(ctx, rect);
  };

  const paintBox = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = config.strokeStyle;
    ctx.lineWidth = config.lineWidth - 0.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.fillRect(0, 0, config.colWidth, config.rowHeight);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.strokeRect(0, 1, config.colWidth, config.rowHeight - 1);
    ctx.stroke();
    ctx.restore();
  };

  const paintRows = (rowData: IRow[]) => {
    if (!canvasRef.current || !rowData.length) return;

    let ctx = canvasRef.current.getContext("2d")!;

    let id = +selectedCellId.split(",")[1];

    for (let row of rowData) {
      let highlight = row.rowId === id || selectedColumnId !== Infinity;
      paintRow(ctx, highlight, row);
    }

    ctx.save();
    ctx.strokeStyle = config.strokeStyle;
    ctx.lineWidth = config.lineWidth - 0.5;
    ctx.beginPath();
    ctx.moveTo(0, config.rowHeight);
    ctx.lineTo(0, canvasRef.current.clientHeight);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(config.colWidth, config.rowHeight);
    ctx.lineTo(config.colWidth, canvasRef.current.clientHeight);
    ctx.stroke();
    ctx.restore();
  };

  const paintColumns = (columnData: IColumn[]) => {
    if (!canvasRef.current || !columnData.length) return;

    let ctx = canvasRef.current.getContext("2d")!;

    let id = +selectedCellId.split(",")[0];

    for (let column of columnData) {
      let highlight = column.columnId === id || selectedRowId !== Infinity;
      paintColumn(ctx, highlight, column);
    }

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = config.strokeStyle;
    ctx.lineWidth = config.lineWidth - 0.5;
    ctx.moveTo(config.colWidth, config.rowHeight);
    ctx.lineTo(canvasRef.current.clientWidth, config.rowHeight);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(config.colWidth, 1);
    ctx.lineTo(canvasRef.current.clientWidth, 1);
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

    ctx.clearRect(0, 0, clientWidth, clientHeight);

    let rowData: IRow[] = [];
    let columnData: IColumn[] = [];
    let cellData: ICell[] = [];

    for (let i = rowStart, y = offsetY; y < clientHeight; i++) {
      let height = rowDetails[i]?.height || config.cellHeight;

      if (y + height > config.rowHeight) {
        rowData.push({
          y,
          x: 0,
          rowId: i,
          height: height,
          width: config.colWidth,
        });
      }

      y += height;
    }

    for (let i = colStart, x = offsetX; x < clientWidth; i++) {
      let width = columnDetails[i]?.width || config.cellWidth;

      if (x + width > config.colWidth) {
        columnData.push({
          x,
          y: 0,
          columnId: i,
          width,
          height: config.rowHeight,
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

    paintRows(rowData);
    paintColumns(columnData);
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
    setContextMenuPositon(null);
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

      while (rowId > 0 && y > config.rowHeight) {
        y -= rowDetails[rowId]?.height ?? config.cellHeight;
        rowId--;
      }

      renderGrid({
        offsetX: x,
        offsetY: Math.min(config.rowHeight, y),
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

      while (columnId > 0 && x > config.colWidth) {
        x -= columnDetails[columnId]?.width ?? config.cellWidth;
        columnId--;
      }

      renderGrid({
        offsetX: Math.min(config.colWidth, x),
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
      x: Math.max(config.colWidth, x),
      y: Math.max(config.rowHeight + top, y + top),
    });
  };

  const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleClickGrid(event);
    setContextMenuPositon({ x: event.pageX, y: event.pageY });
  };

  const handleClickColumn = (columnId: number) => {
    setSelectedColumnId(columnId);
    setSelectedRowId(Infinity);
    setSelectedCellId("");
    setEditCell(null);
    setContextMenuPositon(null);
  };

  const handleClickRow = (rowId: number) => {
    setSelectedRowId(rowId);
    setSelectedColumnId(Infinity);
    setSelectedCellId("");
    setEditCell(null);
    setContextMenuPositon(null);
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

  const handleSearchNext = () => {
    setActiveSearchIndex((activeIndex) => {
      activeIndex++;
      return activeIndex === highLightCellIds.length ? 0 : activeIndex;
    });
  };

  const handleSearchPrevious = () => {
    setActiveSearchIndex((activeIndex) => {
      activeIndex--;
      return activeIndex < 0 ? highLightCellIds.length - 1 : activeIndex;
    });
  };

  const handleSearchSheet = (text: string) => {
    setHighLightCellIds(["1,1", "2,5", "4,5", "5,1", "2,2"]);
  };

  const handleCloseSearch = () => {
    setShowSearch(false);
    setHighLightCellIds([]);
  };

  const handleCopyCell = () => {
    console.log("copy");
  };

  const handleCutCell = () => {
    console.log("cut");
  };

  const handlePasteCell = () => {
    console.log("paste");
  };

  const handleDeleteCell = () => {
    console.log("delete cell");
  };

  const handleDeleteRow = () => {
    console.log("delete row");
  };

  const handleDeleteColumn = () => {
    console.log("delete column");
  };

  const handleInsertColumnLeft = () => {
    console.log("insert column left");
  };

  const handleInsertColumnRight = () => {
    console.log("insert column right");
  };

  const handleInsertRowBottom = () => {
    console.log("insert row bottom");
  };

  const handleInsertRowTop = () => {
    console.log("insert row top");
  };

  return (
    <Fragment>
      <ToolBar />
      <FormularBar />
      <div
        ref={gridRef}
        className="relative h-[var(--grid-height)] select-none overflow-hidden"
        onClick={handleClickGrid}
        onContextMenu={handleContextMenu}
        onWheel={handleScroll}
      >
        <canvas ref={canvasRef}></canvas>
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
        {selectedColumn && <HighLightColumn selectedColumn={selectedColumn} />}
        {selectedRow && <HighLightRow selectedRow={selectedRow} />}
        <div className="absolute left-[var(--col-width)] top-[var(--row-height)] w-[calc(100%-var(--col-width))] h-[calc(100%-var(--row-height))] overflow-hidden">
          {!editCell && selectedCell && (
            <HighlightCell
              selectedCell={selectedCell}
              onDoubleClick={handleDoubleClickCell}
            />
          )}
          {showSearch && highLightCellIds.length > 0 && (
            <HighLightSearch
              activeIndex={activeSearchIndex}
              visibleCells={cells}
              cellIds={highLightCellIds}
            />
          )}
          {selectedColumn && <ColumnOverLay selectedColumn={selectedColumn} />}
          {selectedRow && <RowOverLay selectedRow={selectedRow} />}
        </div>
      </div>
      {editCell && (
        <EditCell
          cell={editCell}
          data={cellDetails[editCell.cellId]}
          onWheel={handleScroll}
        />
      )}
      {showSearch && (
        <SeachBox
          count={highLightCellIds.length}
          activeIndex={activeSearchIndex}
          onNext={handleSearchNext}
          onPrevious={handleSearchPrevious}
          onSearch={handleSearchSheet}
          onClose={handleCloseSearch}
        />
      )}
      {contextMenuPosition && (
        <ContextMenu
          position={contextMenuPosition}
          onCopy={handleCopyCell}
          onCut={handleCutCell}
          onPaste={handlePasteCell}
          onDeleteCell={handleDeleteCell}
          onDeleteColumn={handleDeleteColumn}
          onDeleteRow={handleDeleteRow}
          onInsertColumnLeft={handleInsertColumnLeft}
          onInsertColumnRight={handleInsertColumnRight}
          onInsertRowBottom={handleInsertRowBottom}
          onInsertRowTop={handleInsertRowTop}
        />
      )}
    </Fragment>
  );
};

export default Grid;
