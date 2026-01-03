#!/usr/bin/env python3
"""
MCP 環境診斷腳本
用於檢查 interactive-feedback-mcp 所需的環境配置
"""
import os
import sys
import subprocess
import json
from pathlib import Path

def log_result(data):
    """將診斷結果寫入日誌文件"""
    log_path = Path(r"c:\Users\qwerb\Coffee_Order_platform\.cursor\debug.log")
    try:
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(data, ensure_ascii=False) + "\n")
    except Exception as e:
        print(f"無法寫入日誌: {e}")

def check_command(cmd, args=["--version"]):
    """檢查命令是否可用"""
    try:
        result = subprocess.run(
            [cmd] + args,
            capture_output=True,
            text=True,
            timeout=5
        )
        return {
            "available": True,
            "version": result.stdout.strip() if result.returncode == 0 else None,
            "error": result.stderr.strip() if result.returncode != 0 else None
        }
    except FileNotFoundError:
        return {"available": False, "error": "命令不存在"}
    except Exception as e:
        return {"available": False, "error": str(e)}

def check_path():
    """檢查 PATH 環境變量"""
    path_env = os.environ.get("PATH", "")
    paths = path_env.split(os.pathsep) if path_env else []
    return {
        "paths": paths,
        "python_paths": [p for p in paths if "python" in p.lower()],
        "uv_paths": [p for p in paths if "uv" in p.lower()],
    }

def check_mcp_directory():
    """檢查 MCP 伺服器目錄"""
    mcp_dir = Path(r"C:\Users\qwerb\interactive-feedback-mcp-main")
    result = {
        "exists": mcp_dir.exists(),
        "server_py_exists": (mcp_dir / "server.py").exists(),
    }
    if mcp_dir.exists():
        result["files"] = [f.name for f in mcp_dir.iterdir() if f.is_file()]
    return result

def main():
    session_id = "mcp-diagnosis"
    
    # 假設 A: uv 未安裝
    result_uv = check_command("uv")
    log_result({
        "sessionId": session_id,
        "runId": "diagnosis",
        "hypothesisId": "A",
        "location": "diagnose_mcp_env.py:check_command",
        "message": "檢查 uv 命令可用性",
        "data": {"command": "uv", "result": result_uv},
        "timestamp": int(__import__("time").time() * 1000)
    })
    
    # 假設 B: uv 已安裝但不在 PATH 中
    path_info = check_path()
    log_result({
        "sessionId": session_id,
        "runId": "diagnosis",
        "hypothesisId": "B",
        "location": "diagnose_mcp_env.py:check_path",
        "message": "檢查 PATH 環境變量",
        "data": path_info,
        "timestamp": int(__import__("time").time() * 1000)
    })
    
    # 假設 C: Python 可用性
    result_python = check_command("python")
    log_result({
        "sessionId": session_id,
        "runId": "diagnosis",
        "hypothesisId": "C",
        "location": "diagnose_mcp_env.py:check_command",
        "message": "檢查 Python 命令可用性",
        "data": {"command": "python", "result": result_python},
        "timestamp": int(__import__("time").time() * 1000)
    })
    
    # 假設 D: MCP 目錄結構
    mcp_info = check_mcp_directory()
    log_result({
        "sessionId": session_id,
        "runId": "diagnosis",
        "hypothesisId": "D",
        "location": "diagnose_mcp_env.py:check_mcp_directory",
        "message": "檢查 MCP 伺服器目錄",
        "data": mcp_info,
        "timestamp": int(__import__("time").time() * 1000)
    })
    
    # 假設 E: 檢查 pip 是否可用（用於安裝 uv）
    result_pip = check_command("pip", ["--version"])
    log_result({
        "sessionId": session_id,
        "runId": "diagnosis",
        "hypothesisId": "E",
        "location": "diagnose_mcp_env.py:check_command",
        "message": "檢查 pip 命令可用性（用於安裝 uv）",
        "data": {"command": "pip", "result": result_pip},
        "timestamp": int(__import__("time").time() * 1000)
    })
    
    # 總結
    print("=" * 60)
    print("MCP 環境診斷結果")
    print("=" * 60)
    print(f"\n1. UV 命令: {'可用' if result_uv['available'] else '不可用'}")
    if not result_uv['available']:
        print(f"   錯誤: {result_uv.get('error', '未知錯誤')}")
    
    print(f"\n2. Python 命令: {'可用' if result_python['available'] else '不可用'}")
    if result_python['available']:
        print(f"   版本: {result_python.get('version', '未知')}")
    
    print(f"\n3. PIP 命令: {'可用' if result_pip['available'] else '不可用'}")
    
    print(f"\n4. MCP 目錄: {'存在' if mcp_info['exists'] else '不存在'}")
    if mcp_info['exists']:
        print(f"   server.py: {'存在' if mcp_info['server_py_exists'] else '不存在'}")
    
    print(f"\n5. PATH 中的 Python 相關路徑: {len(path_info['python_paths'])} 個")
    print(f"   PATH 中的 uv 相關路徑: {len(path_info['uv_paths'])} 個")
    
    print("\n" + "=" * 60)
    print("診斷完成。結果已記錄到 debug.log")
    print("=" * 60)

if __name__ == "__main__":
    main()





