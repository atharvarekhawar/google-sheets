import { useEffect, useRef, useState } from "react";
import classNames from "classnames";

import { ICell } from "@/types/Sheets";

type IActiveCellProps = {
  cell: ICell;
};

const ActiveCell = ({ cell }: IActiveCellProps) => {
  const [isEdit, setIsEdit] = useState(false);

  const inputRef = useRef<HTMLDivElement>(null);

  let {
    columnId,
    height,
    id,
    rowId,
    width,
    x,
    y,
    props: { backgroundColor, color, content = "", text },
  } = cell;

  useEffect(() => {
    if (!isEdit) return;
    setIsEdit(false);
  }, [cell]);

  useEffect(() => {
    if (!isEdit || !inputRef.current) return;
    inputRef.current.focus();
  }, [isEdit]);

  const handleDoubleClick = () => {
    setIsEdit(true);
  };
  console.log(isEdit);

  return (
    <div
      className={classNames(
        "absolute flex text-sm bg-transparent border-2 p-1 z-10",
        isEdit
          ? "border-dark-blue outline outline-3 outline-light-blue"
          : "border-blue"
      )}
      style={{
        left: x,
        top: y,
        width: width,
        height: height,
        backgroundColor,
        color,
      }}
      onDoubleClick={handleDoubleClick}
    >
      <div
        ref={inputRef}
        className={classNames("flex outline-none overflow-hidden", {
          "items-end": !isEdit,
        })}
        contentEditable={isEdit}
        dangerouslySetInnerHTML={{ __html: content }}
      ></div>
    </div>
  );
};

export default ActiveCell;