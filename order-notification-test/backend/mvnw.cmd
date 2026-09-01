@REM ----------------------------------------------------------------------------
@REM Maven Start Up Batch script
@REM ----------------------------------------------------------------------------
@IF "%DEBUG%" == "" @ECHO OFF
SETLOCAL

SET MAVEN_PROJECTBASEDIR=%~dp0
IF "%MAVEN_PROJECTBASEDIR:~-1%"=="\" SET MAVEN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR:~0,-1%

SET EMBEDDED_MVN="%MAVEN_PROJECTBASEDIR%\.mvn\apache-maven-3.9.6\bin\mvn.cmd"

IF EXIST %EMBEDDED_MVN% (
    CALL %EMBEDDED_MVN% %*
    EXIT /B %ERRORLEVEL%
)

mvn.cmd %*
IF ERRORLEVEL 1 (
    mvn %*
)
