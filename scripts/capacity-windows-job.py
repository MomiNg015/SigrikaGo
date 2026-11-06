"""Opt-in Windows reference benchmark limits. Never touches other applications.

JOB_OBJECT_LIMIT_JOB_MEMORY caps committed memory, not whole-machine physical RAM.
The driver has affinity/priority only; the server owns an independent job.
"""
import ctypes as c
from ctypes import wintypes as w
import json
from datetime import datetime, timezone
import os
from pathlib import Path
import sys
import time

k = c.WinDLL("kernel32", use_last_error=True)
SIZE = c.c_size_t


class Basic(c.Structure):
    _fields_ = [("ProcessTime", c.c_longlong), ("JobTime", c.c_longlong),
                ("Flags", w.DWORD), ("MinWS", SIZE), ("MaxWS", SIZE),
                ("ActiveProcesses", w.DWORD), ("Affinity", SIZE),
                ("Priority", w.DWORD), ("Scheduling", w.DWORD)]


class IO(c.Structure):
    _fields_ = [(name, c.c_ulonglong) for name in
                ["ReadOps", "WriteOps", "OtherOps", "ReadBytes", "WriteBytes", "OtherBytes"]]


class Extended(c.Structure):
    _fields_ = [("Basic", Basic), ("IO", IO), ("ProcessMemory", SIZE),
                ("JobMemory", SIZE), ("PeakProcessMemory", SIZE), ("PeakJobMemory", SIZE)]


class Memory(c.Structure):
    _fields_ = [("Length", w.DWORD), ("Load", w.DWORD)] + [
        (name, c.c_ulonglong) for name in ["Total", "Available", "TotalPage", "AvailablePage",
                                          "TotalVirtual", "AvailableVirtual", "Extended"]]


def api(name, result, args):
    fn = getattr(k, name)
    fn.restype = result
    fn.argtypes = args
    return fn


open_process = api("OpenProcess", w.HANDLE, [w.DWORD, w.BOOL, w.DWORD])
close = api("CloseHandle", w.BOOL, [w.HANDLE])
create_job = api("CreateJobObjectW", w.HANDLE, [c.c_void_p, w.LPCWSTR])
set_job = api("SetInformationJobObject", w.BOOL, [w.HANDLE, c.c_int, c.c_void_p, w.DWORD])
query_job = api("QueryInformationJobObject", w.BOOL, [w.HANDLE, c.c_int, c.c_void_p, w.DWORD, c.c_void_p])
assign = api("AssignProcessToJobObject", w.BOOL, [w.HANDLE, w.HANDLE])
affinity = api("SetProcessAffinityMask", w.BOOL, [w.HANDLE, SIZE])
get_affinity = api("GetProcessAffinityMask", w.BOOL, [w.HANDLE, c.POINTER(SIZE), c.POINTER(SIZE)])
priority = api("SetPriorityClass", w.BOOL, [w.HANDLE, w.DWORD])
wait = api("WaitForSingleObject", w.DWORD, [w.HANDLE, w.DWORD])
memory = api("GlobalMemoryStatusEx", w.BOOL, [c.POINTER(Memory)])
terminate = api("TerminateJobObject", w.BOOL, [w.HANDLE, w.UINT])


def check(value):
    if not value:
        raise c.WinError(c.get_last_error())
    return value


pid, role = int(sys.argv[1]), sys.argv[2]
mask = int(os.environ[f"CAPACITY_{role.upper()}_AFFINITY"], 0)
handle = check(open_process(0x100000 | 0x0200 | 0x0400 | 0x0100 | 0x0001, False, pid))
job = None
try:
    check(affinity(handle, mask))
    check(priority(handle, 0x4000))  # BELOW_NORMAL_PRIORITY_CLASS
    actual, system = SIZE(), SIZE()
    check(get_affinity(handle, c.byref(actual), c.byref(system)))
    if actual.value != mask:
        raise RuntimeError("Affinity verification failed")
    result = {"ready": True, "pid": pid, "role": role, "affinityMask": hex(mask),
              "logicalProcessors": mask.bit_count(), "priority": "below-normal"}
    if role == "server":
        job = check(create_job(None, None))
        limits = Extended()
        limits.Basic.Flags = 0x200 | 0x10 | 0x2000  # kill only owned descendants when guard closes
        limits.Basic.Affinity = mask
        limits.JobMemory = int(os.environ.get("CAPACITY_SERVER_MEMORY_MIB", "1536")) * 1024 ** 2
        check(set_job(job, 9, c.byref(limits), c.sizeof(limits)))
        check(assign(job, handle))
        verified = Extended()
        check(query_job(job, 9, c.byref(verified), c.sizeof(verified), None))
        if verified.JobMemory != limits.JobMemory:
            raise RuntimeError("Memory limit verification failed")
        result["jobCommittedLimitBytes"] = verified.JobMemory
    print(json.dumps(result), flush=True)
    if job:
        floor = int(os.environ.get("CAPACITY_MIN_FREE_MIB", "1024")) * 1024 ** 2
        result["minimumFreeBytes"] = None
        result["stoppedForHostMemory"] = False
        while wait(handle, 1000) == 258:
            status = Memory()
            status.Length = c.sizeof(status)
            check(memory(c.byref(status)))
            result["minimumFreeBytes"] = min(result["minimumFreeBytes"] or status.Available, status.Available)
            if status.Available < floor:
                result["stoppedForHostMemory"] = True
                check(terminate(job, 75))  # only this benchmark server and its children
                state_path = os.environ.get("VERIFICATION_GUARD_STATE")
                if state_path:
                    state_file = Path(state_path)
                    state = json.loads(state_file.read_text(encoding="utf-8"))
                    state.update(status="resource-aborted", exitCode=75,
                                 completedAt=datetime.now(timezone.utc).isoformat(),
                                 reason="Host available physical memory below configured floor")
                    state_file.write_text(json.dumps(state, indent=2), encoding="utf-8")
                break
        check(query_job(job, 9, c.byref(verified), c.sizeof(verified), None))
        result["peakJobCommittedBytes"] = verified.PeakJobMemory
        output = Path(os.environ.get("CAPACITY_REPORT_DIR", "artifacts/capacity"))
        output.mkdir(parents=True, exist_ok=True)
        (output / f"windows-limits-{pid}-{time.time_ns()}.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
finally:
    if job:
        close(job)
    close(handle)
