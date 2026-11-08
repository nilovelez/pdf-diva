# Lists the apps Windows offers for .pdf (the "Open with" list) and can open a file through the
# PDFDiva.pdf ProgID exactly as Explorer would (ShellExecuteEx with that class).
param([string]$OpenFile)
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class Assoc {
  [ComImport, Guid("F04061AC-1659-4a3f-A954-775AA57FC083"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  public interface IAssocHandler {
    [PreserveSig] int GetName([MarshalAs(UnmanagedType.LPWStr)] out string name);
    [PreserveSig] int GetUIName([MarshalAs(UnmanagedType.LPWStr)] out string name);
    [PreserveSig] int GetIconLocation([MarshalAs(UnmanagedType.LPWStr)] out string path, out int index);
    [PreserveSig] int IsRecommended();
  }
  [ComImport, Guid("973810ae-9599-4b88-9e4d-6ee98c9552da"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
  public interface IEnumAssocHandlers {
    [PreserveSig] int Next(uint count, [Out, MarshalAs(UnmanagedType.LPArray, SizeParamIndex = 0)] IAssocHandler[] handlers, out uint fetched);
  }
  [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
  static extern int SHAssocEnumHandlers(string ext, int filter, out IEnumAssocHandlers e);
  public static string List(string ext) {
    IEnumAssocHandlers e; SHAssocEnumHandlers(ext, 0, out e);
    var sb = new System.Text.StringBuilder();
    var one = new IAssocHandler[1]; uint got;
    while (e.Next(1, one, out got) == 0 && got == 1) {
      string ui, path; one[0].GetUIName(out ui); one[0].GetName(out path);
      sb.AppendLine(ui + "  |  " + path + "  |  recommended=" + (one[0].IsRecommended() == 0));
    }
    return sb.ToString();
  }
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
  struct SHELLEXECUTEINFO {
    public int cbSize; public uint fMask; public IntPtr hwnd; public string lpVerb; public string lpFile;
    public string lpParameters; public string lpDirectory; public int nShow; public IntPtr hInstApp;
    public IntPtr lpIDList; public string lpClass; public IntPtr hkeyClass; public uint dwHotKey;
    public IntPtr hIcon; public IntPtr hProcess;
  }
  [DllImport("shell32.dll", CharSet = CharSet.Unicode)] static extern bool ShellExecuteEx(ref SHELLEXECUTEINFO i);
  public static bool OpenWithClass(string file, string progId) {
    var i = new SHELLEXECUTEINFO(); i.cbSize = Marshal.SizeOf(i);
    i.fMask = 0x1; /* SEE_MASK_CLASSNAME */ i.lpVerb = "open"; i.lpFile = file; i.lpClass = progId; i.nShow = 1;
    return ShellExecuteEx(ref i);
  }
}
'@
[Assoc]::List('.pdf')
if ($OpenFile) { "open via PDFDiva.pdf: " + [Assoc]::OpenWithClass($OpenFile, 'PDFDiva.pdf') }
