import React from "react";
import { PRESET_LAYOUT_CONFIGS } from "@/utils/presetLayouts";
import layout10Bg from "@/assets/idcard-layout-10.jpeg";
import layout11Bg from "@/assets/id-card-layout-11.jpeg";
import layout12Bg from "@/assets/id-card-layout-12.jpeg";

import { getCardDimensionsMm } from "@/utils/printLayoutEngine";

function srcOf(imported: any): string {
  if (typeof imported === "string") return imported;
  return imported?.src ?? imported?.default?.src ?? imported?.default ?? "";
}

export interface CardTheme {
  primary: string;
  secondary: string;
  background: string;
  textMain: string;
  textSub: string;
}

interface IdCardProps {
  layout: number;
  theme: CardTheme;
  school: {
    name: string;
    caption?: string;
    address?: string;
    logoUrl: string;
    signatureUrl?: string;
    phone?: string;
    customValues?: any;
    customFieldsConfig?: any;
    idCardLayoutConfig?: any;
  };
  student: {
    name: string;
    fatherName?: string;
    fatherPhone?: string;
    address?: string;
    profilePictureUrl?: string;
    idNo?: string;
    camSno?: string;
    motherName?: string;
    motherPhone?: string;
    customValues?: any;
  };
  classNameStr: string;
  classCustomValues?: any;
  hideFields?: boolean;
}

export default function IdCard({
  layout,
  theme,
  school,
  student,
  classNameStr,
  classCustomValues,
  hideFields = false,
}: IdCardProps) {
  let layoutConfig = school.idCardLayoutConfig;
  if (typeof layoutConfig === "string") {
    try {
      layoutConfig = JSON.parse(layoutConfig);
    } catch {
      layoutConfig = null;
    }
  }

  const { widthMm: cardWMm, heightMm: cardHMm, widthPx, heightPx } = getCardDimensionsMm(layoutConfig);
  const cardWPx = `${widthPx}px`;
  const cardHPx = `${heightPx}px`;

  const cardContainerStyle = {
    width: cardWPx,
    height: cardHPx,
    backgroundColor: theme.background,
    border: "0.1px solid black",
  };

  // --- BACKGROUND RENDERING FOR PRESET LAYOUTS ---
  const renderBackground = () => {
    switch (layout) {
      case 1:
        return (
          <div
            className="absolute top-0 left-0 w-full h-85 rounded-b-[50%] z-0"
            style={{ backgroundColor: theme.primary }}
          ></div>
        );
      case 2:
        return (
          <div
            className="absolute top-0 left-0 w-full h-100 z-0"
            style={{
              backgroundColor: theme.primary,
              clipPath: "polygon(0 0, 100% 0, 100% 60%, 0% 100%)",
            }}
          ></div>
        );
      case 3:
        return (
          <div
            className="absolute inset-9 z-0 border-[6px]"
            style={{ borderColor: theme.primary }}
          ></div>
        );
      case 4:
        return (
          <div
            className="absolute top-0 bottom-0 left-0 w-20 z-0"
            style={{ backgroundColor: theme.primary }}
          ></div>
        );
      case 5:
        return (
          <>
            <div
              className="absolute top-0 left-0 w-full h-[50%] z-0"
              style={{ backgroundColor: theme.primary }}
            ></div>
            <div
              className="absolute bottom-0 left-0 w-full h-[50%] z-0"
              style={{ backgroundColor: theme.secondary }}
            ></div>
          </>
        );
      case 6:
        return (
          <div
            className="absolute bottom-0 left-0 w-full h-87.5 rounded-t-[50%] z-0"
            style={{ backgroundColor: theme.primary }}
          ></div>
        );
      case 7:
        return (
          <>
            <div
              className="absolute top-0 left-0 w-full h-50 z-0"
              style={{ backgroundColor: theme.primary }}
            ></div>
            <div
              className="absolute bottom-0 left-0 w-full h-37.5 z-0"
              style={{ backgroundColor: theme.secondary }}
            ></div>
          </>
        );
      case 8:
        return (
          <>
            <div
              className="absolute top-0 left-0 w-full h-[50%] z-0"
              style={{
                backgroundColor: theme.primary,
                clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 80%)",
              }}
            ></div>
            <div
              className="absolute bottom-0 left-0 w-full h-[50%] z-0"
              style={{
                backgroundColor: theme.secondary,
                clipPath: "polygon(0 20%, 100% 0, 100% 100%, 0 100%)",
              }}
            ></div>
          </>
        );
      case 9:
        return (
          <div
            className="absolute top-0 right-0 w-80 h-80 z-0"
            style={{
              backgroundColor: theme.primary,
              clipPath: "polygon(100% 0, 0 0, 100% 100%)",
            }}
          ></div>
        );
      case 10:
        return (
          <img
            src={srcOf(layout10Bg)}
            alt="Bg"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        );
      case 11:
        return (
          <img
            src={srcOf(layout11Bg)}
            alt="Bg"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        );
      case 12:
        return (
          <img
            src={srcOf(layout12Bg)}
            alt="Bg"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        );
      default:
        return null;
    }
  };

  let fields = layoutConfig?.fields;
  if (!fields && layout >= 1 && layout <= 12) {
    fields = PRESET_LAYOUT_CONFIGS[layout]?.fields || {};
  } else if (!fields) {
    fields = fields || {};
  }

  const isCustomOrShared = layout === 0 || layout >= 13;
  const backgroundUrl = layoutConfig?.backgroundUrl;

  const customCardStyle = {
    width: cardWPx,
    height: cardHPx,
    backgroundColor: theme.background,
    backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : "none",
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative" as const,
    overflow: "hidden" as const,
    border: "0.1px solid black",
  };

  return (
    <div className="relative box-border overflow-hidden mx-auto shadow-2xl" style={customCardStyle}>
      {!isCustomOrShared && !backgroundUrl && renderBackground()}

      {!hideFields && Object.entries(fields).map(([fieldKey, f]: [string, any]) => {
        if (!f || !f.visible) return null;

        const isAddress = (fieldKey === "school_address" || fieldKey === "student_address") && f.addressFormat !== "singleline";
        const isMultiline =
          isAddress ||
          fieldKey === "school_name" ||
          fieldKey === "school_caption";

        const align = f.align || "left";
        const vertAlign = f.verticalAlign || "center";
        const strokeWidth = f.strokeWidth || 0;
        const strokeColor = f.strokeColor || "#ffffff";
        const scaleX = f.scaleX || 1;
        const scaleY = f.scaleY || 1;

        let leftPos = `${f.x}px`;
        let transformStr = `scale(${scaleX}, ${scaleY})`;
        let transformOriginStr = "top left";

        const cardHalfWidth = Math.round(cardWMm * 11.8110236) / 2;

        if (align === "center") {
          const centerX = f.width ? f.x + f.width / 2 : (f.x > 0 && f.x < cardHalfWidth ? cardHalfWidth : f.x);
          leftPos = `${centerX}px`;
          transformStr = `translate(-50%, 0) scale(${scaleX}, ${scaleY})`;
          transformOriginStr = "top center";
        } else if (align === "right") {
          const rightX = f.width ? f.x + f.width : f.x;
          leftPos = `${rightX}px`;
          transformStr = `translate(-100%, 0) scale(${scaleX}, ${scaleY})`;
          transformOriginStr = "top right";
        }

        const isImageField = fieldKey === "school_logo" || fieldKey === "student_photo" || fieldKey === "principal_signature";

        const fieldStyle: React.CSSProperties = {
          position: "absolute",
          left: leftPos,
          top: `${f.y}px`,
          width: f.width ? `${f.width}px` : undefined,
          height: f.height ? `${f.height}px` : undefined,
          fontFamily: f.fontFamily ? `'${f.fontFamily}', sans-serif` : undefined,
          fontSize: f.fontSize ? `${f.fontSize}px` : undefined,
          fontWeight: f.fontWeight || undefined,
          color: f.color || undefined,
          textAlign: align as React.CSSProperties["textAlign"],
          lineHeight: 1.25,
          WebkitTextStroke: strokeWidth > 0 ? `${strokeWidth}px ${strokeColor}` : undefined,
          paintOrder: strokeWidth > 0 ? "stroke fill" : undefined,
          display: !isImageField && f.height ? "flex" : undefined,
          flexDirection: !isImageField && f.height ? "column" : undefined,
          justifyContent: !isImageField && f.height ? (vertAlign === "top" ? "flex-start" : vertAlign === "bottom" ? "flex-end" : "center") : undefined,
          zIndex: 20,
          whiteSpace: f.width ? (f.addressFormat === "singleline" ? "normal" : "pre-line") : (isAddress ? "pre-line" : isMultiline ? "normal" : "nowrap"),
          wordBreak: "break-word",
          overflowWrap: "break-word",
          overflow: "hidden",
          transform: transformStr,
          transformOrigin: transformOriginStr,
        };

        const imageBorderWidth = typeof f.borderWidth === "number" ? f.borderWidth : (parseInt(f.borderWidth || "0", 10) || 0);
        const imageBorderColor = f.borderColor || "#000000";
        const imageBorderRadius = f.borderRadius ? (typeof f.borderRadius === "number" ? `${f.borderRadius}px` : f.borderRadius) : "0";

        const imageStyle: React.CSSProperties = {
          ...fieldStyle,
          borderRadius: imageBorderRadius,
          border: imageBorderWidth > 0 ? `${imageBorderWidth}px solid ${imageBorderColor}` : undefined,
          boxSizing: "border-box",
        };

        if (fieldKey === "school_logo") {
          return school.logoUrl ? (
            <img
              key={fieldKey}
              src={school.logoUrl}
              alt="Logo"
              crossOrigin="anonymous"
              style={imageStyle}
              className="object-cover"
            />
          ) : null;
        }

        if (fieldKey === "student_photo") {
          let photoUrl = student.profilePictureUrl || (student as any).photoUrl || (student as any).profilePic;
          if (!photoUrl && student.customValues) {
            let customVals = student.customValues;
            if (typeof customVals === "string") {
              try { customVals = JSON.parse(customVals); } catch { customVals = null; }
            }
            photoUrl = customVals?.profilePictureUrl || customVals?.photoUrl || customVals?.profilePic;
          }

          return photoUrl ? (
            <img
              key={fieldKey}
              src={photoUrl}
              alt="Student"
              crossOrigin="anonymous"
              style={imageStyle}
              className="object-cover"
            />
          ) : null;
        }

        if (fieldKey === "principal_signature") {
          return school.signatureUrl ? (
            <img
              key={fieldKey}
              src={school.signatureUrl}
              alt="Sign"
              crossOrigin="anonymous"
              style={imageStyle}
              className="object-cover"
            />
          ) : null;
        }

        let textContent = "";
        let labelPrefix = "";

        if (fieldKey === "school_name") {
          textContent = school.name;
        } else if (fieldKey === "school_caption") {
          textContent = school.caption || "";
        } else if (fieldKey === "school_address") {
          textContent = school.address || "";
        } else if (fieldKey === "school_phone") {
          textContent = school.phone || "";
        } else if (fieldKey === "student_name") {
          textContent = student.name;
        } else if (fieldKey === "class_name") {
          textContent = classNameStr;
          labelPrefix = "Class: ";
        } else if (fieldKey === "student_idNo") {
          textContent = student.idNo || "";
          labelPrefix = "ID No: ";
        } else if (fieldKey === "student_camSno") {
          textContent = student.camSno || "";
          labelPrefix = "CAM S.No: ";
        } else if (fieldKey === "student_fatherName") {
          textContent = student.fatherName || "";
          labelPrefix = "F's Name: ";
        } else if (fieldKey === "student_motherName") {
          let customVals = student.customValues;
          if (typeof customVals === "string") {
            try { customVals = JSON.parse(customVals); } catch { customVals = null; }
          }
          textContent = (student as any).motherName || customVals?.motherName || customVals?.mother_name || "";
          labelPrefix = "M's Name: ";
        } else if (fieldKey === "student_fatherPhone") {
          textContent = student.fatherPhone || "";
          labelPrefix = "Cell: ";
        } else if (fieldKey === "student_motherPhone") {
          let customVals = student.customValues;
          if (typeof customVals === "string") {
            try { customVals = JSON.parse(customVals); } catch { customVals = null; }
          }
          textContent = (student as any).motherPhone || customVals?.motherPhone || customVals?.mother_phone || "";
          labelPrefix = "Cell: ";
        } else if (fieldKey === "student_address") {
          textContent = student.address || "";
          labelPrefix = "Address: ";
        } else if (fieldKey.startsWith("student_custom_")) {
          const k = fieldKey.replace("student_custom_", "");
          let customVals = student.customValues;
          if (typeof customVals === "string") {
            try { customVals = JSON.parse(customVals); } catch { customVals = null; }
          }
          textContent = customVals?.[k] || "";
          labelPrefix = `${k.charAt(0).toUpperCase() + k.slice(1)}: `;
        } else if (fieldKey.startsWith("school_custom_")) {
          const k = fieldKey.replace("school_custom_", "");
          let customVals = school.customValues;
          if (typeof customVals === "string") {
            try { customVals = JSON.parse(customVals); } catch { customVals = null; }
          }
          textContent = customVals?.[k] || "";
          labelPrefix = `${k.charAt(0).toUpperCase() + k.slice(1)}: `;
        } else if (fieldKey.startsWith("class_custom_")) {
          const k = fieldKey.replace("class_custom_", "");
          let customVals = classCustomValues;
          if (typeof customVals === "string") {
            try { customVals = JSON.parse(customVals); } catch { customVals = null; }
          }
          textContent = customVals?.[k] || "";
          labelPrefix = `${k.charAt(0).toUpperCase() + k.slice(1)}: `;
        }

        const isSingleLine = f.addressFormat === "singleline_space" || f.addressFormat === "singleline_comma" || f.addressFormat === "singleline";
        if (isSingleLine && typeof textContent === "string") {
          if (f.addressFormat === "singleline_comma") {
            textContent = textContent.replace(/[\r\n]+/g, ", ").replace(/,\s*,/g, ",").trim();
          } else {
            textContent = textContent.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
          }
        }

        if (!textContent) return null;

        return (
          <div key={fieldKey} style={fieldStyle} className="leading-tight">
            <div
              className={`leading-tight select-none overflow-hidden w-full ${f.width ? (f.addressFormat === "singleline" ? "whitespace-normal break-words" : "whitespace-pre-line break-words") : isAddress ? "whitespace-pre-line break-words" : isMultiline ? "whitespace-normal break-words" : "whitespace-nowrap"}`}
              style={{ textAlign: align as React.CSSProperties["textAlign"] }}
            >
              {f.labelVisible !== false && labelPrefix ? (
                <span className="font-bold opacity-80 mr-1">{labelPrefix}</span>
              ) : null}
              <span className={isAddress || (f.width && f.addressFormat !== "singleline") ? "whitespace-pre-line break-words" : ""}>{textContent}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
