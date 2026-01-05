#!/usr/bin/env python3
"""
驗證 uv 修復的腳本
"""
import os
import subprocess
import json
from pathlib import Path

def log_result(data):
    """將驗證結果寫入日誌文件"""
    log_path = Path(r"c:\Users\qwerb\Coffee_Order_platform\.cursor\debug.log")
    try:
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(data, ensure_ascii=False) + "\n")
    except Exception as e:
        print(f"無法寫入日誌: {e}")

def check_uv_command():
    """檢查 uv 命令是否可用"""
    try:
        result = subprocess.run(
            ["uv", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        return {
            "available": result.returncode == 0,
            "version": result.stdout.strip() if result.returncode == 0 else None,
            "error": result.stderr.strip() if result.returncode != 0 else None
        }
    except FileNotFoundError:
        return {"available": False, "error": "命令不存在"}
    except Exception as e:
        return {"available": False, "error": str(e)}

def check_mcp_server():
    """檢查 MCP 伺服器目錄和文件"""
    mcp_dir = Path(r"C:\Users\qwerb\interactive-feedback-mcp-main")
    server_py = mcp_dir / "server.py"
    
    return {
        "directory_exists": mcp_dir.exists(),
        "server_py_exists": server_py.exists(),
        "can_run_uv_in_directory": False
    }

def test_uv_run():
    """測試 uv run 命令"""
    mcp_dir = r"C:\Users\qwerb\interactive-feedback-mcp-main"
    try:
        # 只測試 uv 是否能夠識別命令，不實際運行服務器
        result = subprocess.run(
            ["uv", "--directory", mcp_dir, "run", "--help"],
            capture_output=True,
            text=True,
            timeout=10,
            cwd=mcp_dir
        )
        return {
            "success": result.returncode == 0,
            "output": result.stdout[:200] if result.stdout else None,
            "error": result.stderr[:200] if result.stderr else None
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def main():
    session_id = "uv-verification"
    
    # 驗證 1: uv 命令可用性
    uv_check = check_uv_command()
    log_result({
        "sessionId": session_id,
        "runId": "verification",
        "hypothesisId": "VERIFY_A",
        "location": "verify_uv_fix.py:check_uv_command",
        "message": "驗證 uv 命令可用性（修復後）",
        "data": {"result": uv_check},
        "timestamp": int(__import__("time").time() * 1000)
    })
    
    # 驗證 2: uv run 命令測試
    if uv_check["available"]:
        uv_run_test = test_uv_run()
        log_result({
            "sessionId": session_id,
            "runId": "verification",
            "hypothesisId": "VERIFY_B",
            "location": "verify_uv_fix.py:test_uv_run",
            "message": "驗證 uv run 命令在 MCP 目錄中是否可用",
            "data": {"result": uv_run_test},
            "timestamp": int(__import__("time").time() * 1000)
        })
    
    # 驗證 3: MCP 目錄結構
    mcp_check = check_mcp_server()
    log_result({
        "sessionId": session_id,
        "runId": "verification",
        "hypothesisId": "VERIFY_C",
        "location": "verify_uv_fix.py:check_mcp_server",
        "message": "驗證 MCP 伺服器目錄結構",
        "data": mcp_check,
        "timestamp": int(__import__("time").time() * 1000)
    })
    
    # 輸出結果
    print("=" * 60)
    print("UV 修復驗證結果")
    print("=" * 60)
    print(f"\n1. UV 命令: {'可用' if uv_check['available'] else '不可用'}")
    if uv_check['available']:
        print(f"   版本: {uv_check.get('version', '未知')}")
    else:
        print(f"   錯誤: {uv_check.get('error', '未知錯誤')}")
    
    if uv_check['available']:
        print(f"\n2. UV run 命令: {'可用' if 'success' in locals() and uv_run_test.get('success') else '測試失敗'}")
    
    print(f"\n3. MCP 目錄: {'存在' if mcp_check['directory_exists'] else '不存在'}")
    print(f"   server.py: {'存在' if mcp_check['server_py_exists'] else '不存在'}")
    
    print("\n" + "=" * 60)
    if uv_check['available']:
        print("✓ 修復成功！uv 命令現在可用")
        print("請重新啟動 Cursor 以讓 MCP 伺服器使用新的 PATH")
    else:
        print("✗ 修復未完成，請檢查 PATH 設置")
    print("=" * 60)

if __name__ == "__main__":
    main()







